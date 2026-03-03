export function formatNumber(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "--";
  }
  return new Intl.NumberFormat("pt-BR").format(value);
}

export function formatPercent(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return "--";
  }
  return `${value.toFixed(2)}%`;
}
