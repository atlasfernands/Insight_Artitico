import { describe, expect, it } from "vitest";
import {
  buildDailyMetrics,
  calculateTrendStatusFromSlope,
  calculateWeeklyGrowthPct,
  safeDivide,
} from "@/lib/metrics/calculations";

describe("metrics calculations", () => {
  it("safeDivide handles zero denominator", () => {
    expect(safeDivide(10, 0)).toBe(0);
  });

  it("calculateWeeklyGrowthPct follows expected formula", () => {
    expect(calculateWeeklyGrowthPct(1200, 1000)).toBe(20);
  });

  it("calculateTrendStatusFromSlope classifies correctly", () => {
    expect(calculateTrendStatusFromSlope(5)).toBe("up");
    expect(calculateTrendStatusFromSlope(-5)).toBe("down");
    expect(calculateTrendStatusFromSlope(1)).toBe("stable");
  });

  it("buildDailyMetrics computes fixed business formulas", () => {
    const metrics = buildDailyMetrics({
      streamsTotal: 10000,
      monthlyListeners: 4000,
      followersTotal: 10000,
      streams7dAgo: 9000,
      trendSeries: [9000, 9300, 9400, 9500, 9700, 9850, 10000],
    });

    expect(metrics.streamsPerListener).toBe(2.5);
    expect(metrics.retentionIndexEst).toBe(37.5);
    expect(metrics.engagementIndex).toBe(1);
    expect(metrics.weeklyGrowthPct).toBe(11.11);
    expect(metrics.trendStatus).toBe("up");
  });
});
