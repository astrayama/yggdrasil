'use client';

import Link from 'next/link';

type UpgradeCalloutProps = {
  eyebrow?: string;
  title: string;
  description: string;
  ctaLabel?: string;
  href?: string;
  align?: 'left' | 'center';
  compact?: boolean;
  className?: string;
};

export function UpgradeCallout({
  eyebrow = 'Upgrade Required',
  title,
  description,
  ctaLabel = 'Upgrade',
  href = '/pricing',
  align = 'left',
  compact = false,
  className = '',
}: UpgradeCalloutProps) {
  const alignmentClass = align === 'center' ? 'text-center' : 'text-left';
  const containerPadding = compact ? 'p-4' : 'p-6';
  const titleClass = compact ? 'text-xl' : 'text-2xl';
  const buttonPadding = compact ? 'px-4 py-2' : 'px-5 py-2.5';

  return (
    <div className={`rounded-xl border border-gold/25 bg-background/90 ${containerPadding} ${alignmentClass} shadow-lg shadow-gold/10 backdrop-blur-sm ${className}`.trim()}>
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gold/80">{eyebrow}</p>
      <h3 className={`mt-2 font-display ${titleClass} text-foreground`}>{title}</h3>
      <p className="mt-3 text-sm leading-6 text-foreground/70">{description}</p>
      <Link
        href={href}
        className={`mt-5 inline-flex rounded-sm border border-gold/30 bg-gold/10 ${buttonPadding} text-sm font-medium text-gold transition-colors hover:bg-gold/20`}
      >
        {ctaLabel}
      </Link>
    </div>
  );
}
