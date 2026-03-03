import type { DailyMetrics, TrendStatus } from "@/lib/types";

function round(value: number, precision = 4): number {
  const factor = 10 ** precision;
  return Math.round(value * factor) / factor;
}

export function safeDivide(numerator: number, denominator: number): number {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator <= 0) {
    return 0;
  }
  return numerator / denominator;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function calculateWeeklyGrowthPct(
  todayStreams: number,
  streams7dAgo: number,
): number {
  if (!Number.isFinite(todayStreams) || !Number.isFinite(streams7dAgo) || streams7dAgo <= 0) {
    return 0;
  }
  return round(((todayStreams - streams7dAgo) / streams7dAgo) * 100, 2);
}

export function calculateTrendStatusFromSlope(slopePct: number): TrendStatus {
  if (slopePct > 3) {
    return "up";
  }
  if (slopePct < -3) {
    return "down";
  }
  return "stable";
}

export function calculateSlopePctFromSeries(values: number[]): number {
  if (values.length < 2) {
    return 0;
  }

  const first = values[0];
  const last = values[values.length - 1];
  if (!Number.isFinite(first) || !Number.isFinite(last) || first <= 0) {
    return 0;
  }

  return round(((last - first) / first) * 100, 2);
}

interface BuildDailyMetricsInput {
  streamsTotal: number;
  monthlyListeners: number;
  followersTotal: number;
  streams7dAgo: number;
  trendSeries: number[];
}

export function buildDailyMetrics(input: BuildDailyMetricsInput): DailyMetrics {
  const streamsPerListener = round(
    safeDivide(input.streamsTotal, input.monthlyListeners),
    4,
  );
  const retentionIndexEst = round(
    clamp(((streamsPerListener - 1) / 4) * 100, 0, 100),
    2,
  );
  const engagementIndex = round(
    safeDivide(input.streamsTotal, input.followersTotal),
    4,
  );
  const weeklyGrowthPct = calculateWeeklyGrowthPct(
    input.streamsTotal,
    input.streams7dAgo,
  );
  const slopePct = calculateSlopePctFromSeries(input.trendSeries);
  const trendStatus = calculateTrendStatusFromSlope(slopePct);

  return {
    streamsPerListener,
    retentionIndexEst,
    engagementIndex,
    trendStatus,
    weeklyGrowthPct,
  };
}
