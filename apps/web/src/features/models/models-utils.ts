import type { ModelRoute } from "@/shared/lib/api-client/models";

function formatCost(value: unknown): string {
  if (value === null || value === undefined) return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return "-";
  return `$${(num * 1_000_000).toFixed(2)}/Mi`;
}

export function getInputCost(route: ModelRoute): string {
  return formatCost(route.inputCostPerToken);
}

export function getOutputCost(route: ModelRoute): string {
  return formatCost(route.outputCostPerToken);
}

function formatTokenCount(value: unknown): string {
  if (value === null || value === undefined) return "-";
  const num = Number(value);
  if (Number.isNaN(num) || num === 0) return "-";
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(0)}K`;
  }
  return num.toString();
}

export function getContextWindow(route: ModelRoute): string {
  return formatTokenCount(route.contextWindowSize);
}

export function getMaxOutput(route: ModelRoute): string {
  return formatTokenCount(route.maxOutputTokens);
}
