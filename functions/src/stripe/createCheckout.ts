import { HttpsError, onCall } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { BillingPeriod, getAppUrl, getPriceIdByBillingPeriod, getStripe, isRecurringBillingPeriod, stripeSecret } from './shared';
import {
  buildLifetimeUpgradeCheckout,
  findActiveRecurringSubscription,
  findExistingStripeCustomerId,
  findRecurringUpgradeMatchByEmail,
  type StripeRecurringSubscription,
} from './lifetimeUpgrade';
import { getStripeBillingContext } from './store';

export const createCheckout = onCall({ secrets: [stripeSecret] }, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const billingPeriod = request.data?.billingPeriod as BillingPeriod | undefined;
  const email = request.auth.token.email;

  if (!billingPeriod || !['monthly', 'yearly', 'lifetime'].includes(billingPeriod)) {
    throw new HttpsError('invalid-argument', 'Invalid billingPeriod.');
  }

  if (!email) {
    throw new HttpsError('failed-precondition', 'Authenticated user is missing an email address.');
  }

  try {
    const db = admin.firestore();
    const stripe = getStripe();
    const priceId = getPriceIdByBillingPeriod()[billingPeriod];
    if (!priceId) {
      throw new Error(`Stripe price ID for ${billingPeriod} is not configured.`);
    }
    const appUrl = getAppUrl();
    const userRef = db.doc(`users/${request.auth.uid}`);
    const { stripeCustomerId: storedStripeCustomerId, stripeSubscriptionId } = await getStripeBillingContext(request.auth.uid);

    let stripeCustomerId = storedStripeCustomerId;
    let currentSubscription: StripeRecurringSubscription | null = null;

    if (billingPeriod === 'lifetime') {
      const matchedCustomer = await findRecurringUpgradeMatchByEmail(email);
      if (matchedCustomer) {
        stripeCustomerId = matchedCustomer.customerId;
        currentSubscription = matchedCustomer.subscription;
        await userRef.set({ stripeCustomerId }, { merge: true });
      }
    }

    if (!stripeCustomerId) {
      const existingStripeCustomerId = await findExistingStripeCustomerId(email);

      if (existingStripeCustomerId) {
        stripeCustomerId = existingStripeCustomerId;
      }

      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email,
          metadata: { uid: request.auth.uid },
        });
        stripeCustomerId = customer.id;
      }

      await userRef.set({ stripeCustomerId }, { merge: true });
    }

    const sessionMetadata: Record<string, string> = {
      uid: request.auth.uid,
      priceId,
      billingPeriod,
    };

    const sessionParams: any = {
      mode: isRecurringBillingPeriod(billingPeriod) ? 'subscription' : 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      customer: stripeCustomerId,
      client_reference_id: request.auth.uid,
      metadata: sessionMetadata,
      success_url: `${appUrl}/pricing?success=true`,
      cancel_url: `${appUrl}/pricing?cancelled=true`,
      allow_promotion_codes: billingPeriod !== 'lifetime',
    };

    if (billingPeriod === 'lifetime' && stripeCustomerId) {
      currentSubscription ??= await findActiveRecurringSubscription(
        stripeCustomerId,
        stripeSubscriptionId ?? undefined,
      );

      if (currentSubscription) {
        const lifetimeUpgrade = await buildLifetimeUpgradeCheckout(priceId, currentSubscription);
        Object.assign(sessionMetadata, lifetimeUpgrade.metadata);
        if (lifetimeUpgrade.lineItems) {
          sessionParams.line_items = lifetimeUpgrade.lineItems;
        }
      }
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    if (!session.url) {
      throw new Error('Stripe did not return a checkout URL.');
    }

    return { url: session.url };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to create checkout session.';
    throw new HttpsError('internal', message);
  }
});
