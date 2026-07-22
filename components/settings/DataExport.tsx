'use client';

import { useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { toast } from 'sonner';
import { UpgradeCallout } from '@/components/billing/UpgradeCallout';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';
import { db } from '@/lib/firebase/client';
import { logDataExported } from '@/lib/analytics/client';
import type { JournalEntry } from '@/types/journal';

type ExportEntry = {
  id: string;
  title?: string;
  content?: string;
  type?: string;
  tags?: string[];
  mood?: {
    polarity?: number;
    intensity?: number;
    label?: string;
  };
  createdAt?: unknown;
  updatedAt?: unknown;
  entryDate?: unknown;
  analysisStatus?: string;
  analysis?: unknown;
  linkedRootIds?: string[];
};

type JournalExport = {
  exportedAt: string;
  version: 1;
  userId: string;
  entries: ExportEntry[];
};

function normalizeForExport(value: unknown): unknown {
  if (value === null || value === undefined) return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value !== 'object') return value;

  if ('toDate' in value && typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(normalizeForExport);
  }

  return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((acc, [key, nested]) => {
    if (key === 'embedding') return acc;
    acc[key] = normalizeForExport(nested);
    return acc;
  }, {});
}

function buildExportEntry(entry: JournalEntry): ExportEntry {
  const mood =
    entry.moodPolarity !== undefined || entry.moodIntensity !== undefined || entry.moodLabel
      ? {
          ...(entry.moodPolarity !== undefined ? { polarity: entry.moodPolarity } : {}),
          ...(entry.moodIntensity !== undefined ? { intensity: entry.moodIntensity } : {}),
          ...(entry.moodLabel ? { label: entry.moodLabel } : {}),
        }
      : undefined;

  return {
    id: entry.id,
    ...(entry.title ? { title: entry.title } : {}),
    ...(entry.content ? { content: entry.content } : {}),
    ...(entry.entryType ? { type: entry.entryType } : {}),
    ...(entry.tags ? { tags: entry.tags } : {}),
    ...(mood ? { mood } : {}),
    ...(entry.createdAt !== undefined ? { createdAt: normalizeForExport(entry.createdAt) } : {}),
    ...(entry.updatedAt !== undefined ? { updatedAt: normalizeForExport(entry.updatedAt) } : {}),
    ...(entry.entryDate !== undefined ? { entryDate: normalizeForExport(entry.entryDate) } : {}),
    ...(entry.analysisStatus ? { analysisStatus: entry.analysisStatus } : {}),
    ...(entry.analysis ? { analysis: normalizeForExport(entry.analysis) } : {}),
    ...(entry.linkedRootIds ? { linkedRootIds: entry.linkedRootIds } : {}),
  };
}

function downloadJson(exportData: JournalExport): void {
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const date = exportData.exportedAt.slice(0, 10);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `yggdrasil-journal-export-${date}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export function DataExport() {
  const { user } = useAuth();
  const subscription = useSubscription();
  const [exporting, setExporting] = useState(false);
  const isPro = subscription.entitlement === 'PRO';

  const handleExport = async () => {
    if (!user) return;

    if (!isPro) {
      toast.error('Data export is available with Pro.');
      return;
    }

    setExporting(true);
    try {
      const snapshot = await getDocs(collection(db, `users/${user.uid}/entries`));
      const exportedAt = new Date().toISOString();
      const exportData: JournalExport = {
        exportedAt,
        version: 1,
        userId: user.uid,
        entries: snapshot.docs
          .map((docSnap) => buildExportEntry({
            id: docSnap.id,
            ...docSnap.data(),
          } as JournalEntry))
          .sort((a, b) => {
            const aDate = typeof a.entryDate === 'number' ? a.entryDate : 0;
            const bDate = typeof b.entryDate === 'number' ? b.entryDate : 0;
            return bDate - aDate;
          }),
      };

      downloadJson(exportData);
      logDataExported({
        entryCount: exportData.entries.length,
        format: 'json',
        exportedAt,
      });
      toast.success('Journal export downloaded');
    } catch (error) {
      console.error('Failed to export journal data', error);
      toast.error('Failed to export journal data');
    } finally {
      setExporting(false);
    }
  };

  return (
    <section className="mb-12 border-t border-border/40 pt-8">
      <h2 className="text-xl font-display text-foreground mb-4">Export your data</h2>
      <p className="text-muted-foreground text-sm mb-6">
        Download a structured JSON file with your journal entries, analysis summaries, moods, tags, and linked roots for therapy or coaching sessions.
      </p>

      {subscription.loading ? (
        <div className="h-28 animate-pulse rounded-xl border border-border/40 bg-surface-2" />
      ) : isPro ? (
        <div className="rounded-xl border border-border/40 bg-surface-2 p-5">
          <p className="text-sm text-foreground/80">
            Your export stays on this device. Raw embeddings, billing records, and internal logs are excluded.
          </p>
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting || !user}
            className="mt-4 rounded-lg border border-gold/30 bg-gold/10 px-4 py-2 text-sm font-medium text-gold transition-colors hover:bg-gold/20 disabled:opacity-50"
          >
            {exporting ? 'Preparing export...' : 'Download JSON export'}
          </button>
        </div>
      ) : (
        <UpgradeCallout
          eyebrow="Pro Feature"
          title="Export your journal for therapy or coaching"
          description="Upgrade to Pro to download your entries and analyses in a structured file you can bring into deeper support sessions."
          ctaLabel="View plans"
          compact
        />
      )}
    </section>
  );
}
