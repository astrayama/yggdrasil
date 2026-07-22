'use client';

import { useSearchParams } from 'next/navigation';
import { PlanCard, type PlanCardActionProps } from '@/components/billing/PlanCard';
import { useSubscription } from '@/hooks/useSubscription';

function MonthlyCard(props: PlanCardActionProps) {
  return (
    <PlanCard
      billingPeriod="monthly"
      title="Pro Monthly"
      price="$8.99/mo"
      description="Unlock premium reflections, hidden connections, the full graph, and export tools."
      {...props}
    />
  );
}

function YearlyCard(props: PlanCardActionProps) {
  return (
    <PlanCard
      billingPeriod="yearly"
      title="Pro Annual"
      price="$89.99/yr"
      description="Everything in Pro with the best recurring price for steady practice."
      badge="Most Popular"
      subtext="Save 25% - 3 months free"
      {...props}
    />
  );
}

function LifetimeCard(props: PlanCardActionProps) {
  return (
    <PlanCard
      billingPeriod="lifetime"
      title="Lifetime"
      price="$149"
      description="One payment for permanent access to the paid Yggdrasil workspace."
      badge="Founding Member"
      subtext="Will increase post-launch"
      {...props}
    />
  );
}

export default function PricingPage() {
  const searchParams = useSearchParams();
  const subscription = useSubscription();
  const cancelled = searchParams.get('cancelled') === 'true';

  if (subscription.loading) {
    return (
      <PricingLayout cancelled={cancelled}>
        <MonthlyCard actionLabel="Loading..." isCurrent={false} disabled />
        <YearlyCard actionLabel="Loading..." isCurrent={false} disabled />
        <LifetimeCard actionLabel="Loading..." isCurrent={false} disabled />
      </PricingLayout>
    );
  }

  if (!subscription.billingPeriod) {
    return (
      <PricingLayout cancelled={cancelled}>
        <MonthlyCard actionLabel="Choose plan" isCurrent={false} />
        <YearlyCard actionLabel="Choose plan" isCurrent={false} />
        <LifetimeCard actionLabel="Choose plan" isCurrent={false} />
      </PricingLayout>
    );
  }

  if (subscription.billingPeriod === 'monthly') {
    return (
      <PricingLayout cancelled={cancelled}>
        <MonthlyCard
          actionLabel="Manage subscription"
          helperText="Change billing or cancel"
          isCurrent
          useBillingPortal
          openInNewTab
        />
        <YearlyCard
          actionLabel="Upgrade"
          helperText="Takes effect right away"
          isCurrent={false}
          useBillingPortal
          billingPortalBillingPeriod="yearly"
        />
        <LifetimeCard
          actionLabel="Upgrade"
          helperText="Unused time is applied at checkout"
          isCurrent={false}
        />
      </PricingLayout>
    );
  }

  if (subscription.billingPeriod === 'yearly') {
    return (
      <PricingLayout cancelled={cancelled}>
        <MonthlyCard
          actionLabel="Downgrade"
          helperText="Takes effect next billing cycle"
          isCurrent={false}
          useBillingPortal
          billingPortalBillingPeriod="monthly"
        />
        <YearlyCard
          actionLabel="Manage subscription"
          helperText="Change billing or cancel"
          isCurrent
          useBillingPortal
          openInNewTab
        />
        <LifetimeCard
          actionLabel="Upgrade"
          helperText="Unused time is applied at checkout"
          isCurrent={false}
        />
      </PricingLayout>
    );
  }

  return (
    <PricingLayout cancelled={cancelled}>
      <MonthlyCard actionLabel="Not available" isCurrent={false} disabled />
      <YearlyCard actionLabel="Not available" isCurrent={false} disabled />
      <LifetimeCard
        actionLabel="Access active"
        helperText="Permanent access. No renewal needed."
        isCurrent
        disabled
      />
    </PricingLayout>
  );
}

function PricingLayout({
  cancelled,
  children,
}: {
  cancelled: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-2xl space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/80">Pricing</p>
        <h1 className="font-display text-4xl text-foreground sm:text-5xl">
          Choose the depth you want to keep open.
        </h1>
        <p className="text-base leading-7 text-foreground/70">
          Every plan keeps journaling safe. Paid tiers unlock the layers that turn the journal into a living reflection system.
        </p>
      </div>

      {cancelled ? (
        <div className="mt-6 rounded-xl border border-border/60 bg-surface-2 px-5 py-4 text-sm text-foreground/75">
          No problem. You can upgrade any time.
        </div>
      ) : null}

      <div className="mt-10 grid gap-6 lg:grid-cols-3">
        {children}
      </div>
    </div>
  );
}
