import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { RecurringBillingPeriod, getAppUrl, getPriceIdByBillingPeriod, getStripe, stripeSecret } from './shared';
import { getStripeBillingContext } from './store';

export const createBillingPortalSession = onCall({ secrets: [stripeSecret] }, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const billingPeriod = request.data?.billingPeriod as RecurringBillingPeriod | undefined;

  if (billingPeriod && !['monthly', 'yearly'].includes(billingPeriod)) {
    throw new HttpsError('invalid-argument', 'Billing portal updates only support recurring plans.');
  }

  try {
    const { stripeCustomerId, stripeSubscriptionId } = await getStripeBillingContext(request.auth.uid);

    if (!stripeCustomerId || !stripeSubscriptionId) {
      throw new HttpsError('failed-precondition', 'No active Stripe subscription is attached to this account.');
    }

    const stripe = getStripe();
    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    const subscriptionItem = subscription.items.data[0];

    if (!subscriptionItem) {
      throw new HttpsError('failed-precondition', 'Subscription item not found for this account.');
    }

    if (!billingPeriod) {
      const session = await stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: `${getAppUrl()}/pricing`,
      });

      const subscriptionUrl = new URL(session.url);
      subscriptionUrl.pathname = `${subscriptionUrl.pathname}/subscriptions/${stripeSubscriptionId}`;
      subscriptionUrl.searchParams.set('type', 'product');

      return { url: subscriptionUrl.toString() };
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${getAppUrl()}/pricing`,
      flow_data: {
        type: 'subscription_update_confirm',
        after_completion: {
          type: 'redirect',
          redirect: {
            return_url: `${getAppUrl()}/pricing`,
          },
        },
        subscription_update_confirm: {
          subscription: stripeSubscriptionId,
          items: [
            {
              id: subscriptionItem.id,
              price: getPriceIdByBillingPeriod()[billingPeriod] ?? (() => { throw new Error(`Missing price ID for ${billingPeriod}`) })(),
              quantity: subscriptionItem.quantity ?? 1,
            },
          ],
        },
      },
    });

    return { url: session.url };
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : 'Unable to create billing portal session.';
    throw new HttpsError('internal', message);
  }
});
