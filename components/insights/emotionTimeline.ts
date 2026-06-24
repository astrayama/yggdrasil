import type { EntryAnalysis, JournalEntry } from '@/types/journal';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface EmotionTimelineEntry {
  id: string;
  createdAt: number;
  analysisStatus?: JournalEntry['analysisStatus'];
}

export interface EmotionTimelinePoint {
  id: string;
  entryId: string;
  timestamp: number;
  date: Date;
  label: string;
  intensity: number;
  polarity: number;
}

export interface EmotionThemeCount {
  theme: string;
  count: number;
}

export interface EmotionTimelineData {
  points: EmotionTimelinePoint[];
  topThemes: EmotionThemeCount[];
  selectedEmotionLabels: string[];
}

export interface BuildEmotionTimelineOptions {
  dateRangeDays: number;
  now: number;
  maxEmotionLabels?: number;
}

export interface SelectTimelineTicksOptions {
  domain: readonly [Date, Date];
  dateRangeDays: number;
  chartWidth: number;
}

interface EmotionOccurrence {
  point: EmotionTimelinePoint;
  firstSeenIndex: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function getDayInterval(dateRangeDays: number, chartWidth: number) {
  if (dateRangeDays <= 14) {
    if (chartWidth < 340) return 7;
    if (chartWidth < 480) return 4;
    return 2;
  }

  if (chartWidth < 420) return 14;
  return 7;
}

function getMonthInterval(chartWidth: number) {
  return chartWidth < 420 ? 2 : 1;
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function firstLocalMidnightAfterStart(startDate: Date) {
  const tick = startOfLocalDay(startDate);
  if (tick.getTime() <= startDate.getTime()) {
    tick.setDate(tick.getDate() + 1);
  }
  return tick;
}

function firstLocalMondayAfterStart(startDate: Date) {
  const tick = firstLocalMidnightAfterStart(startDate);
  const daysUntilMonday = (8 - tick.getDay()) % 7;
  tick.setDate(tick.getDate() + daysUntilMonday);
  return tick;
}

function firstLocalMonthAfterStart(startDate: Date) {
  const tick = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  if (tick.getTime() <= startDate.getTime()) {
    tick.setMonth(tick.getMonth() + 1);
  }
  return tick;
}

function appendTickIfInside(ticks: Date[], tick: Date, end: number) {
  if (tick.getTime() <= end) {
    ticks.push(new Date(tick));
  }
}

export function calculateTimelineDomain(dateRangeDays: number, now: number): [Date, Date] {
  return [
    new Date(now - dateRangeDays * MS_PER_DAY),
    new Date(now),
  ];
}

export function selectAdaptiveTimelineTicks(options: SelectTimelineTicksOptions): Date[] {
  const [startDate, endDate] = options.domain;
  const end = endDate.getTime();
  const ticks: Date[] = [];

  if (options.dateRangeDays >= 90) {
    const monthInterval = getMonthInterval(options.chartWidth);
    const tick = firstLocalMonthAfterStart(startDate);
    while (tick.getTime() <= end) {
      appendTickIfInside(ticks, tick, end);
      tick.setMonth(tick.getMonth() + monthInterval);
    }
  } else {
    const dayInterval = getDayInterval(options.dateRangeDays, options.chartWidth);
    const tick = options.dateRangeDays <= 14
      ? firstLocalMidnightAfterStart(startDate)
      : firstLocalMondayAfterStart(startDate);
    while (tick.getTime() <= end) {
      appendTickIfInside(ticks, tick, end);
      tick.setDate(tick.getDate() + dayInterval);
    }
  }

  return ticks.slice(0, clamp(ticks.length, 0, 8));
}

export function formatTimelineAxisTick(date: Date, dateRangeDays: number): string {
  const options: Intl.DateTimeFormatOptions = dateRangeDays >= 90
    ? { month: 'short' }
    : { month: 'short', day: 'numeric' };

  return new Intl.DateTimeFormat('en-US', options).format(date);
}

export function formatExactTimelineTimestamp(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function filterCompletedEntriesByRange(
  entries: readonly EmotionTimelineEntry[],
  dateRangeDays: number,
  now: number
): EmotionTimelineEntry[] {
  const rangeMs = dateRangeDays * MS_PER_DAY;
  const start = now - rangeMs;
  return entries.filter(entry => (
    entry.createdAt >= start &&
    entry.createdAt <= now &&
    entry.analysisStatus === 'complete'
  ));
}

export function buildEmotionTimelineData(
  entries: readonly EmotionTimelineEntry[],
  analyses: Readonly<Record<string, EntryAnalysis | undefined>>,
  options: BuildEmotionTimelineOptions
): EmotionTimelineData {
  const maxEmotionLabels = options.maxEmotionLabels ?? 4;
  const filteredEntries = filterCompletedEntriesByRange(entries, options.dateRangeDays, options.now)
    .sort((a, b) => a.createdAt - b.createdAt);

  const occurrences: EmotionOccurrence[] = [];
  const themeCounts = new Map<string, number>();
  const emotionStats = new Map<string, { totalIntensity: number; count: number; firstSeenIndex: number }>();
  let seenIndex = 0;

  filteredEntries.forEach(entry => {
    const analysis = analyses[entry.id];
    if (!analysis) return;

    analysis.themes?.forEach(theme => {
      themeCounts.set(theme, (themeCounts.get(theme) || 0) + 1);
    });

    analysis.emotions?.forEach((emotion, emotionIndex) => {
      const firstSeenIndex = seenIndex;
      seenIndex += 1;

      const previous = emotionStats.get(emotion.label);
      if (previous) {
        previous.totalIntensity += emotion.intensity;
        previous.count += 1;
      } else {
        emotionStats.set(emotion.label, {
          totalIntensity: emotion.intensity,
          count: 1,
          firstSeenIndex,
        });
      }

      occurrences.push({
        firstSeenIndex,
        point: {
          id: `${entry.id}-${emotionIndex}`,
          entryId: entry.id,
          timestamp: entry.createdAt,
          date: new Date(entry.createdAt),
          label: emotion.label,
          intensity: emotion.intensity,
          polarity: emotion.polarity,
        },
      });
    });
  });

  const selectedEmotionLabels = Array.from(emotionStats.entries())
    .sort((a, b) => {
      const averageA = a[1].totalIntensity / a[1].count;
      const averageB = b[1].totalIntensity / b[1].count;
      if (averageA !== averageB) return averageB - averageA;
      return a[1].firstSeenIndex - b[1].firstSeenIndex;
    })
    .slice(0, maxEmotionLabels)
    .map(([label]) => label);

  const selectedLabels = new Set(selectedEmotionLabels);
  const points = occurrences
    .filter(occurrence => selectedLabels.has(occurrence.point.label))
    .sort((a, b) => a.firstSeenIndex - b.firstSeenIndex)
    .map(occurrence => occurrence.point);

  const topThemes = Array.from(themeCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([theme, count]) => ({ theme, count }));

  return { points, topThemes, selectedEmotionLabels };
}
