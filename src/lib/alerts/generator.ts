import type { DailyMetrics } from "@/lib/types";

interface GeneratedAlert {
  alertType: string;
  severity: "info" | "warning" | "critical";
  title: string;
  description: string;
}

export function generateBusinessAlerts(metrics: DailyMetrics): GeneratedAlert[] {
  const alerts: GeneratedAlert[] = [];

  if (metrics.weeklyGrowthPct >= 20) {
    alerts.push({
      alertType: "abnormal_growth",
      severity: "info",
      title: "Crescimento anormal detectado",
      description: `Seu crescimento semanal estimado subiu ${metrics.weeklyGrowthPct}%`,
    });
  }

  if (metrics.weeklyGrowthPct <= -15) {
    alerts.push({
      alertType: "relevant_drop",
      severity: "warning",
      title: "Queda relevante na semana",
      description: `Seu crescimento semanal estimado caiu ${Math.abs(metrics.weeklyGrowthPct)}%`,
    });
  }

  if (metrics.engagementIndex < 0.3) {
    alerts.push({
      alertType: "low_engagement",
      severity: "warning",
      title: "Engajamento abaixo do ideal",
      description:
        "A razão Streams/Seguidores está abaixo de 0.3; revise distribuição e retenção.",
    });
  }

  return alerts;
}

export function generateTechnicalFallbackAlert(): GeneratedAlert {
  return {
    alertType: "technical_data_fallback",
    severity: "info",
    title: "Fallback de dados aplicado",
    description:
      "A coleta pública falhou hoje. Mantivemos os últimos valores válidos com confiança baixa.",
  };
}
