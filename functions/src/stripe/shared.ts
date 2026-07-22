import Stripe from 'stripe';
import { defineSecret } from 'firebase-functions/params';

export const stripeSecret = defineSecret('STRIPE_SECRET_KEY');
export const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');

export type SubscriptionTier = 'FREE' | 'PRO';
export type SubscriptionStatus = 'active' | 'cancelled' | 'past_due' | 'none';
export type BillingPeriod = 'monthly' | 'yearly' | 'lifetime';
export type RecurringBillingPeriod = Exclude<BillingPeriod, 'lifetime'>;

export const FREE_INSIGHT_LIMIT = 5;
export const FREE_ROOTS_LIMIT = 5;

let stripeClient: any = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getStripe(): any {
  if (!stripeClient) {
    stripeClient = new Stripe(stripeSecret.value() || requireEnv('STRIPE_SECRET_KEY'));
  }

  return stripeClient;
}

export function getAppUrl(): string {
  return requireEnv('APP_URL');
}

export function getPriceIdByBillingPeriod(): Partial<Record<BillingPeriod, string>> {
  return {
    monthly: process.env.STRIPE_PRICE_ID_PRO,
    yearly: process.env.STRIPE_PRICE_ID_ANNUAL,
    lifetime: process.env.STRIPE_PRICE_ID_LIFETIME,
  };
}

export function getBillingPeriodByPriceId(): Record<string, BillingPeriod> {
  const priceIdByBillingPeriod = getPriceIdByBillingPeriod();
  const map: Record<string, BillingPeriod> = {};

  if (priceIdByBillingPeriod.monthly) map[priceIdByBillingPeriod.monthly] = 'monthly';
  if (priceIdByBillingPeriod.yearly) map[priceIdByBillingPeriod.yearly] = 'yearly';
  if (priceIdByBillingPeriod.lifetime) map[priceIdByBillingPeriod.lifetime] = 'lifetime';

  return map;
}

export function billingPeriodFromPriceId(priceId: string): BillingPeriod {
  const billingPeriod = getBillingPeriodByPriceId()[priceId];
  if (billingPeriod) {
    return billingPeriod;
  }

  throw new Error(`Unknown Stripe price ID: ${priceId}`);
}

export function isRecurringBillingPeriod(billingPeriod: BillingPeriod): billingPeriod is RecurringBillingPeriod {
  return billingPeriod !== 'lifetime';
}
