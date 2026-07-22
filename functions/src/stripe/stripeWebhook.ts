import * as admin from 'firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

import { onRequest } from 'firebase-functions/v2/https';
import * as logger from 'firebase-functions/logger';
import {
  billingPeriodFromPriceId,
  getStripe,
  stripeSecret,
  stripeWebhookSecret,
  type BillingPeriod,
  type SubscriptionStatus,
} from './shared';
import {
  logSubscriptionCancelled,
  logSubscriptionRenewed,
  logSubscriptionStarted,
} from '../lib/analytics';

function toErrorDetails(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return { message: error.message, stack: error.stack };
  }

  return { message: String(error) };
}

type SubscriptionRecord = {
  userId: string;
  status: SubscriptionStatus;
  billingPeriod: BillingPeriod | null;
  stripeCustomerId: string;
  stripeSubscriptionId?: string;
  stripeCheckoutSessionId?: string;
  stripePaymentIntentId?: string;
  updatedAt: FieldValue;
};

async function findUserIdByCustomerId(customerId: string): Promise<string | null> {
  const db = admin.firestore();
  const snapshot = await db.collection('users')
    .where('stripeCustomerId', '==', customerId)
    .limit(1)
    .get();

  return snapshot.empty ? null : snapshot.docs[0].id;
}

function getHeaderSignature(header: string | string[] | undefined): string | null {
  if (!header) return null;
  return Array.isArray(header) ? header[0] ?? null : header;
}

async function writeSubscription(
  uid: string,
  values: Omit<SubscriptionRecord, 'userId' | 'updatedAt'>,
): Promise<void> {
  const db = admin.firestore();
  await db.doc(`subscriptions/${uid}`).set({
    userId: uid,
    ...values,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  await db.doc(`users/${uid}`).set({
    stripeCustomerId: values.stripeCustomerId,
  }, { merge: true });
}

async function handleCheckoutCompleted(session: any): Promise<void> {
  const uid = session.metadata?.uid ?? session.client_reference_id;
  const priceId = session.metadata?.priceId;
  const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;

  if (!uid || !priceId || !customerId) {
    logger.warn('checkout.session.completed missing required fields', {
      uid,
      priceId,
      customerId,
      sessionId: session.id,
    });
    return;
  }

  const billingPeriod = billingPeriodFromPriceId(priceId);
  const subscriptionId = typeof session.subscription === 'string'
    ? session.subscription
    : session.subscription?.id;
  const paymentIntentId = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id;
  const replacesSubscriptionId = session.metadata?.replacesSubscriptionId;

  if (billingPeriod === 'lifetime' && replacesSubscriptionId) {
    await getStripe().subscriptions.cancel(replacesSubscriptionId, {
      prorate: false,
    });
  }

  await writeSubscription(uid, {
    status: 'active',
    billingPeriod,
    stripeCustomerId: customerId,
    ...(subscriptionId ? { stripeSubscriptionId: subscriptionId } : {}),
    ...(session.id ? { stripeCheckoutSessionId: session.id } : {}),
    ...(paymentIntentId ? { stripePaymentIntentId: paymentIntentId } : {}),
  });

  await logSubscriptionStarted(uid, billingPeriod);
}

async function handleSubscriptionUpdated(subscription: any): Promise<void> {
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id;
  const uid = subscription.metadata?.uid || await findUserIdByCustomerId(customerId);
  const priceId = subscription.items.data[0]?.price.id;

  if (!uid || !priceId) {
    logger.warn('customer.subscription.updated missing uid or price', {
      subscriptionId: subscription.id,
      customerId,
      uid,
      priceId,
    });
    return;
  }

  const existingSubscription = await admin.firestore().doc(`subscriptions/${uid}`).get();
  const existingData = existingSubscription.data() as { billingPeriod?: BillingPeriod | null } | undefined;

  if (existingData?.billingPeriod === 'lifetime') {
    return;
  }

  const billingPeriod = billingPeriodFromPriceId(priceId);
  const status: SubscriptionStatus = subscription.status === 'past_due' ? 'past_due' : 'active';

  await writeSubscription(uid, {
    status,
    billingPeriod,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
  });

  await logSubscriptionRenewed(uid, billingPeriod);
}

async function handleSubscriptionDeleted(subscription: any): Promise<void> {
  const customerId = typeof subscription.customer === 'string'
    ? subscription.customer
    : subscription.customer.id;
  const uid = subscription.metadata?.uid || await findUserIdByCustomerId(customerId);

  if (!uid) {
    logger.warn('customer.subscription.deleted missing uid', {
      subscriptionId: subscription.id,
      customerId,
    });
    return;
  }

  const existingSubscription = await admin.firestore().doc(`subscriptions/${uid}`).get();
  const existingData = existingSubscription.data() as { billingPeriod?: BillingPeriod | null } | undefined;

  if (existingData?.billingPeriod === 'lifetime') {
    return;
  }

  await writeSubscription(uid, {
    status: 'cancelled',
    billingPeriod: null,
    stripeCustomerId: customerId,
    stripeSubscriptionId: subscription.id,
  });

  await logSubscriptionCancelled(uid);
}

async function handleInvoicePaymentFailed(invoice: any): Promise<void> {
  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
  const uid = invoice.parent && typeof invoice.parent !== 'string'
    ? invoice.parent.subscription_details?.metadata?.uid || (customerId ? await findUserIdByCustomerId(customerId) : null)
    : (customerId ? await findUserIdByCustomerId(customerId) : null);

  if (!uid || !customerId) {
    logger.warn('invoice.payment_failed missing uid', {
      invoiceId: invoice.id,
      customerId,
      uid,
    });
    return;
  }

  await admin.firestore().doc(`subscriptions/${uid}`).set({
    status: 'past_due',
    stripeCustomerId: customerId,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });
}

async function handleChargeRefunded(charge: any): Promise<void> {
  const customerId = typeof charge.customer === 'string' ? charge.customer : charge.customer?.id;
  const paymentIntentId = typeof charge.payment_intent === 'string'
    ? charge.payment_intent
    : charge.payment_intent?.id;

  if (!customerId || !paymentIntentId || !charge.refunded) {
    return;
  }

  const uid = await findUserIdByCustomerId(customerId);

  if (!uid) {
    logger.warn('charge.refunded missing uid', {
      chargeId: charge.id,
      customerId,
      paymentIntentId,
    });
    return;
  }

  const subscriptionRef = admin.firestore().doc(`subscriptions/${uid}`);
  const existingSubscription = await subscriptionRef.get();
  const existingData = existingSubscription.data() as {
    billingPeriod?: BillingPeriod | null;
    stripePaymentIntentId?: string;
  } | undefined;

  if (existingData?.billingPeriod !== 'lifetime' || existingData.stripePaymentIntentId !== paymentIntentId) {
    return;
  }

  await subscriptionRef.set({
    status: 'cancelled',
    billingPeriod: null,
    stripeCustomerId: customerId,
    updatedAt: FieldValue.serverTimestamp(),
  }, { merge: true });

  await logSubscriptionCancelled(uid);
}

export const stripeWebhook = onRequest({ secrets: [stripeSecret, stripeWebhookSecret] }, async (req, res) => {
  const signature = getHeaderSignature(req.headers['stripe-signature']);
  const webhookSecret = stripeWebhookSecret.value() || process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    res.status(400).send('Missing Stripe signature or webhook secret.');
    return;
  }

  let event: any;

  try {
    event = getStripe().webhooks.constructEvent(req.rawBody, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Webhook verification failed.';
    logger.error('Stripe webhook verification failed', { error: message });
    res.status(400).send(message);
    return;
  }

  const db = admin.firestore();
  const processedRef = db.doc(`processedEvents/${event.id}`);

  try {
    if ((await processedRef.get()).exists) {
      res.status(200).json({ received: true, duplicate: true });
      return;
    }

    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as any);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as any);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as any);
        break;
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as any);
        break;
      case 'charge.refunded':
        await handleChargeRefunded(event.data.object as any);
        break;
    }

    await processedRef.set({
      processedAt: FieldValue.serverTimestamp(),
      type: event.type,
    });

    res.status(200).json({ received: true });
  } catch (error) {
    const errorDetails = toErrorDetails(error);
    logger.error('Stripe webhook handler failed', {
      eventId: event.id,
      type: event.type,
      errorMessage: errorDetails.message,
      errorStack: errorDetails.stack,
    });
    res.status(500).send('Webhook handler failed.');
  }
});
