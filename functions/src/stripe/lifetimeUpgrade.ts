
import { getStripe } from './shared';

export type StripeRecurringSubscription = {
  id: string;
  status: string;
  current_period_start?: number;
  current_period_end?: number;
  items: {
    data: Array<{
      current_period_start?: number;
      current_period_end?: number;
      price: {
        unit_amount: number | null;
      };
    }>;
  };
};

export async function findExistingStripeCustomerId(email: string): Promise<string | null> {
  const customers = await getStripe().customers.list({
    email,
    limit: 10,
  });

  const reusableCustomer = customers.data.find((customer: any) => !customer.deleted);
  return reusableCustomer?.id ?? null;
}

export async function findActiveRecurringSubscription(
  stripeCustomerId: string,
  storedSubscriptionId?: string,
): Promise<StripeRecurringSubscription | null> {
  const stripe = getStripe();

  if (storedSubscriptionId) {
    const subscription = await stripe.subscriptions.retrieve(storedSubscriptionId) as unknown as StripeRecurringSubscription;
    if (['active', 'trialing', 'past_due'].includes(subscription.status)) {
      return subscription;
    }
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    status: 'all',
    limit: 10,
  });

  const activeSubscription = subscriptions.data.find((subscription: any) => (
    ['active', 'trialing', 'past_due'].includes(subscription.status)
  ));

  return activeSubscription ? activeSubscription as unknown as StripeRecurringSubscription : null;
}

export async function findRecurringUpgradeMatchByEmail(
  email: string,
): Promise<{ customerId: string; subscription: StripeRecurringSubscription } | null> {
  const customers = await getStripe().customers.list({
    email,
    limit: 10,
  });

  for (const customer of customers.data) {
    if (customer.deleted) {
      continue;
    }

    const subscription = await findActiveRecurringSubscription(customer.id);
    if (subscription) {
      return {
        customerId: customer.id,
        subscription,
      };
    }
  }

  return null;
}

function computeLifetimeUpgradeCreditCents(subscription: StripeRecurringSubscription): number {
  const firstItem = subscription.items.data[0];
  const unitAmount = firstItem?.price.unit_amount ?? 0;

  if (unitAmount <= 0) {
    return 0;
  }

  const periodStart = subscription.current_period_start ?? firstItem?.current_period_start;
  const periodEnd = subscription.current_period_end ?? firstItem?.current_period_end;

  if (!periodStart || !periodEnd) {
    return 0;
  }

  const now = Math.floor(Date.now() / 1000);
  const totalSeconds = Math.max(1, periodEnd - periodStart);
  const remainingSeconds = Math.max(0, periodEnd - now);

  return Math.max(0, Math.round(unitAmount * (remainingSeconds / totalSeconds)));
}

export async function buildLifetimeUpgradeCheckout(
  priceId: string,
  recurringSubscription: StripeRecurringSubscription,
): Promise<{
  lineItems?: NonNullable<any>;
  metadata: Record<string, string>;
}> {
  const stripe = getStripe();
  const metadata: Record<string, string> = {
    replacesSubscriptionId: recurringSubscription.id,
  };
  const lifetimePrice = await stripe.prices.retrieve(priceId);
  const lifetimeAmount = lifetimePrice.unit_amount ?? 0;
  const creditAmount = Math.min(
    computeLifetimeUpgradeCreditCents(recurringSubscription),
    Math.max(0, lifetimeAmount - 1),
  );

  if (creditAmount <= 0) {
    return { metadata };
  }

  metadata.upgradeCreditCents = String(creditAmount);

  const lifetimeProductId = typeof lifetimePrice.product === 'string'
    ? lifetimePrice.product
    : lifetimePrice.product.id;

  return {
    metadata,
    lineItems: [{
      price_data: {
        currency: lifetimePrice.currency,
        product: lifetimeProductId,
        unit_amount: lifetimeAmount - creditAmount,
        ...(lifetimePrice.tax_behavior && lifetimePrice.tax_behavior !== 'unspecified'
          ? { tax_behavior: lifetimePrice.tax_behavior }
          : {}),
      },
      quantity: 1,
    }],
  };
}
