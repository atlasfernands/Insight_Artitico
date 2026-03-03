import { describe, expect, it } from "vitest";
import { generateBusinessAlerts } from "@/lib/alerts/generator";

describe("alert generation", () => {
  it("emits abnormal growth and low engagement alerts", () => {
    const alerts = generateBusinessAlerts({
      streamsPerListener: 1.2,
      retentionIndexEst: 5,
      engagementIndex: 0.2,
      trendStatus: "up",
      weeklyGrowthPct: 25,
    });

    expect(alerts.some((item) => item.alertType === "abnormal_growth")).toBe(true);
    expect(alerts.some((item) => item.alertType === "low_engagement")).toBe(true);
  });

  it("emits relevant drop alert when growth falls below -15%", () => {
    const alerts = generateBusinessAlerts({
      streamsPerListener: 1,
      retentionIndexEst: 0,
      engagementIndex: 0.8,
      trendStatus: "down",
      weeklyGrowthPct: -22,
    });

    expect(alerts.some((item) => item.alertType === "relevant_drop")).toBe(true);
  });
});
