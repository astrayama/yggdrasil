import type { EntryAnalysis } from '@/types/journal';
import {
  buildEmotionTimelineData,
  calculateTimelineDomain,
  formatExactTimelineTimestamp,
  formatTimelineAxisTick,
  filterCompletedEntriesByRange,
  selectAdaptiveTimelineTicks,
  type EmotionTimelineEntry,
} from './emotionTimeline';

function entry(id: string, createdAt: number): EmotionTimelineEntry {
  return {
    id,
    createdAt,
    analysisStatus: 'complete',
  };
}

function analysis(
  emotions: EntryAnalysis['emotions'],
  themes: EntryAnalysis['themes'] = []
): EntryAnalysis {
  return {
    depthScore: 5,
    entities: [],
    themes,
    emotions,
    keywords: [],
    summary: '',
    safety_concerns: {
      flagged: false,
      concerns: [],
    },
    interpretation: {
      main_insight: '',
      questions: [],
      action_items: [],
      patterns_identified: [],
      growth_connection: '',
    },
  };
}

function expectTicksChronologicalInside(ticks: Date[], domain: readonly [Date, Date]) {
  expect(ticks.length).toBeGreaterThan(0);
  ticks.forEach((tick, index) => {
    expect(tick.getTime()).toBeGreaterThanOrEqual(domain[0].getTime());
    expect(tick.getTime()).toBeLessThanOrEqual(domain[1].getTime());
    if (index > 0) {
      expect(tick.getTime()).toBeGreaterThan(ticks[index - 1].getTime());
    }
  });
}

function medianGapDays(ticks: Date[]) {
  const gaps = ticks.slice(1).map((tick, index) => (
    (tick.getTime() - ticks[index].getTime()) / (24 * 60 * 60 * 1000)
  ));
  return gaps[Math.floor(gaps.length / 2)] ?? 0;
}

describe('emotion timeline transformation', () => {
  const now = Date.UTC(2026, 5, 24, 12, 0, 0, 0);
  const dayMs = 24 * 60 * 60 * 1000;

  it('keeps two entries on the same day as separate points', () => {
    const first = Date.UTC(2026, 5, 24, 8, 0, 0, 0);
    const second = Date.UTC(2026, 5, 24, 10, 0, 0, 0);

    const data = buildEmotionTimelineData(
      [entry('entry-1', first), entry('entry-2', second)],
      {
        'entry-1': analysis([{ label: 'anxious', intensity: 4, polarity: 2 }]),
        'entry-2': analysis([{ label: 'anxious', intensity: 8, polarity: 3 }]),
      },
      { dateRangeDays: 14, now }
    );

    expect(data.points).toHaveLength(2);
    expect(data.points.map(point => point.entryId)).toEqual(['entry-1', 'entry-2']);
  });

  it('keeps two entries in the same hour as separate points', () => {
    const first = Date.UTC(2026, 5, 24, 8, 10, 0, 0);
    const second = Date.UTC(2026, 5, 24, 8, 50, 0, 0);

    const data = buildEmotionTimelineData(
      [entry('entry-1', first), entry('entry-2', second)],
      {
        'entry-1': analysis([{ label: 'hopeful', intensity: 6, polarity: 8 }]),
        'entry-2': analysis([{ label: 'hopeful', intensity: 7, polarity: 8 }]),
      },
      { dateRangeDays: 14, now }
    );

    expect(data.points).toHaveLength(2);
    expect(data.points.map(point => point.timestamp)).toEqual([first, second]);
  });

  it('creates one point per selected emotion occurrence in a single entry', () => {
    const createdAt = Date.UTC(2026, 5, 24, 8, 0, 0, 0);

    const data = buildEmotionTimelineData(
      [entry('entry-1', createdAt)],
      {
        'entry-1': analysis([
          { label: 'sad', intensity: 6, polarity: 2 },
          { label: 'relieved', intensity: 5, polarity: 7 },
        ]),
      },
      { dateRangeDays: 14, now }
    );

    expect(data.points).toHaveLength(2);
    expect(data.points.map(point => point.label)).toEqual(['sad', 'relieved']);
  });

  it('preserves exact timestamp milliseconds', () => {
    const createdAt = Date.UTC(2026, 5, 24, 8, 0, 0, 321);

    const data = buildEmotionTimelineData(
      [entry('entry-1', createdAt)],
      {
        'entry-1': analysis([{ label: 'calm', intensity: 4, polarity: 6 }]),
      },
      { dateRangeDays: 14, now }
    );

    expect(data.points[0].timestamp).toBe(createdAt);
    expect(data.points[0].date.getTime()).toBe(createdAt);
  });

  it('retains entry ID, label, intensity, and polarity on each point', () => {
    const createdAt = Date.UTC(2026, 5, 24, 8, 0, 0, 0);

    const data = buildEmotionTimelineData(
      [entry('entry-1', createdAt)],
      {
        'entry-1': analysis([{ label: 'focused', intensity: 9, polarity: 7 }]),
      },
      { dateRangeDays: 14, now }
    );

    expect(data.points[0]).toMatchObject({
      entryId: 'entry-1',
      label: 'focused',
      intensity: 9,
      polarity: 7,
    });
  });

  it('does not average same-label values on the same day', () => {
    const first = Date.UTC(2026, 5, 24, 8, 0, 0, 0);
    const second = Date.UTC(2026, 5, 24, 10, 0, 0, 0);

    const data = buildEmotionTimelineData(
      [entry('entry-1', first), entry('entry-2', second)],
      {
        'entry-1': analysis([{ label: 'anxious', intensity: 2, polarity: 1 }]),
        'entry-2': analysis([{ label: 'anxious', intensity: 8, polarity: 2 }]),
      },
      { dateRangeDays: 14, now }
    );

    expect(data.points.map(point => point.intensity)).toEqual([2, 8]);
    expect(data.points).not.toContainEqual(expect.objectContaining({ intensity: 5 }));
  });

  it('selects top emotions without mutating or averaging selected points', () => {
    const first = Date.UTC(2026, 5, 24, 8, 0, 0, 0);
    const second = Date.UTC(2026, 5, 24, 10, 0, 0, 0);
    const third = Date.UTC(2026, 5, 24, 11, 0, 0, 0);

    const data = buildEmotionTimelineData(
      [entry('entry-1', first), entry('entry-2', second), entry('entry-3', third)],
      {
        'entry-1': analysis([{ label: 'anxious', intensity: 6, polarity: 2 }]),
        'entry-2': analysis([{ label: 'anxious', intensity: 8, polarity: 2 }]),
        'entry-3': analysis([{ label: 'calm', intensity: 4, polarity: 7 }]),
      },
      { dateRangeDays: 14, now, maxEmotionLabels: 1 }
    );

    expect(data.selectedEmotionLabels).toEqual(['anxious']);
    expect(data.points.map(point => point.intensity)).toEqual([6, 8]);
  });

  it('does not silently discard exact duplicate coordinates', () => {
    const createdAt = Date.UTC(2026, 5, 24, 8, 0, 0, 0);

    const data = buildEmotionTimelineData(
      [entry('entry-1', createdAt), entry('entry-2', createdAt)],
      {
        'entry-1': analysis([{ label: 'calm', intensity: 5, polarity: 6 }]),
        'entry-2': analysis([{ label: 'calm', intensity: 5, polarity: 6 }]),
      },
      { dateRangeDays: 14, now }
    );

    expect(data.points).toHaveLength(2);
    expect(new Set(data.points.map(point => point.entryId))).toEqual(new Set(['entry-1', 'entry-2']));
  });

  it('preserves entries at the date-range boundary', () => {
    const boundary = now - dayMs;
    const outsideBoundary = boundary - 1;

    const filtered = filterCompletedEntriesByRange(
      [entry('included', boundary), entry('excluded', outsideBoundary)],
      1,
      now
    );

    expect(filtered.map(point => point.id)).toEqual(['included']);
  });

  it('excludes future-dated entries from the selected range', () => {
    const filtered = filterCompletedEntriesByRange(
      [entry('current', now), entry('future', now + 1)],
      1,
      now
    );

    expect(filtered.map(point => point.id)).toEqual(['current']);
  });

  it('uses a full 30-day domain when entries are only from the last two days', () => {
    const domain = calculateTimelineDomain(30, now);
    const data = buildEmotionTimelineData(
      [entry('yesterday', now - dayMs), entry('today', now - 2 * 60 * 60 * 1000)],
      {
        yesterday: analysis([{ label: 'calm', intensity: 5, polarity: 6 }]),
        today: analysis([{ label: 'calm', intensity: 7, polarity: 7 }]),
      },
      { dateRangeDays: 30, now }
    );

    expect(domain[0].getTime()).toBe(now - 30 * dayMs);
    expect(domain[1].getTime()).toBe(now);
    expect(data.points.every(point => point.timestamp >= domain[0].getTime())).toBe(true);
    expect(data.points.every(point => point.timestamp <= domain[1].getTime())).toBe(true);
  });

  it('uses a full 90-day domain', () => {
    const domain = calculateTimelineDomain(90, now);

    expect(domain[0].getTime()).toBe(now - 90 * dayMs);
    expect(domain[1].getTime()).toBe(now);
  });

  it('selects chronological natural ticks inside each domain with bounded density', () => {
    const fourteenDayDomain = calculateTimelineDomain(14, now);
    const thirtyDayDomain = calculateTimelineDomain(30, now);
    const ninetyDayDomain = calculateTimelineDomain(90, now);
    const fourteenDayTicks = selectAdaptiveTimelineTicks({
      domain: fourteenDayDomain,
      dateRangeDays: 14,
      chartWidth: 600,
    });
    const thirtyDayTicks = selectAdaptiveTimelineTicks({
      domain: thirtyDayDomain,
      dateRangeDays: 30,
      chartWidth: 600,
    });
    const ninetyDayTicks = selectAdaptiveTimelineTicks({
      domain: ninetyDayDomain,
      dateRangeDays: 90,
      chartWidth: 600,
    });

    expectTicksChronologicalInside(fourteenDayTicks, fourteenDayDomain);
    expectTicksChronologicalInside(thirtyDayTicks, thirtyDayDomain);
    expectTicksChronologicalInside(ninetyDayTicks, ninetyDayDomain);
    expect(fourteenDayTicks.length).toBeLessThanOrEqual(8);
    expect(thirtyDayTicks.length).toBeLessThanOrEqual(6);
    expect(ninetyDayTicks.length).toBeLessThanOrEqual(4);
    expect(medianGapDays(fourteenDayTicks)).toBeGreaterThanOrEqual(1.9);
    expect(medianGapDays(fourteenDayTicks)).toBeLessThanOrEqual(2.1);
    expect(medianGapDays(thirtyDayTicks)).toBeGreaterThanOrEqual(6.9);
    expect(medianGapDays(thirtyDayTicks)).toBeLessThanOrEqual(7.1);
    expect(medianGapDays(ninetyDayTicks)).toBeGreaterThanOrEqual(28);
  });

  it('uses fewer or equally many natural ticks on narrow chart widths', () => {
    const wideTicks = selectAdaptiveTimelineTicks({
      domain: calculateTimelineDomain(30, now),
      dateRangeDays: 30,
      chartWidth: 600,
    });
    const narrowTicks = selectAdaptiveTimelineTicks({
      domain: calculateTimelineDomain(30, now),
      dateRangeDays: 30,
      chartWidth: 260,
    });

    expect(narrowTicks.length).toBeLessThanOrEqual(wideTicks.length);
    expect(medianGapDays(narrowTicks)).toBeGreaterThanOrEqual(medianGapDays(wideTicks));
  });

  it('formats axis labels and exact tooltip timestamps in English', () => {
    const date = new Date(Date.UTC(2026, 5, 12, 12, 30, 15, 123));

    expect(formatTimelineAxisTick(date, 30)).toMatch(/^Jun \d{1,2}$/);
    expect(formatTimelineAxisTick(date, 90)).toBe('Jun');
    expect(formatExactTimelineTimestamp(date)).toContain('Jun');
    expect(formatExactTimelineTimestamp(date)).toContain('2026');
    expect(formatExactTimelineTimestamp(date)).toMatch(/\d{1,2}:\d{2} (AM|PM)$/);
    expect(formatExactTimelineTimestamp(date)).not.toContain('.123');
  });

  it('keeps the latest point visible without requiring its exact timestamp as an axis label', () => {
    const latestTimestamp = now - 60 * 60 * 1000;
    const domain = calculateTimelineDomain(30, now);
    const ticks = selectAdaptiveTimelineTicks({
      domain,
      dateRangeDays: 30,
      chartWidth: 600,
    });
    const data = buildEmotionTimelineData(
      [entry('latest', latestTimestamp)],
      {
        latest: analysis([{ label: 'hopeful', intensity: 7, polarity: 8 }]),
      },
      { dateRangeDays: 30, now }
    );

    expect(data.points[0].timestamp).toBeGreaterThanOrEqual(domain[0].getTime());
    expect(data.points[0].timestamp).toBeLessThanOrEqual(domain[1].getTime());
    expect(ticks.map(tick => tick.getTime())).not.toContain(latestTimestamp);
  });
});
