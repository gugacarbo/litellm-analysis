import { formatCurrency, formatNumber } from "../../lib/format";

export function formatNullableNumber(
  value: number | null,
  decimals = 1,
): string {
  if (value === null || Number.isNaN(value)) return "—";
  return value.toFixed(decimals);
}

export function formatBenchmarkPrice(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "—";
  return `${formatCurrency(value)}/M`;
}

export function formatSpeed(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "—";
  return `${formatNumber(value)} tok/s`;
}

export function formatLatencySeconds(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "—";
  return `${value.toFixed(2)}s`;
}
