export function getApiBase(params: Record<string, unknown>): string {
  return (params?.api_base as string) || '-';
}

function formatCost(value: unknown): string {
  if (value === null || value === undefined) return '-';
  const num = Number(value);
  if (Number.isNaN(num)) return '-';
  return `$${(num * 1_000_000).toFixed(2)}/Mi`;
}

export function getInputCost(params: Record<string, unknown>): string {
  return formatCost(params?.input_cost_per_token);
}

export function getOutputCost(params: Record<string, unknown>): string {
  return formatCost(params?.output_cost_per_token);
}

function formatTokenCount(value: unknown): string {
  if (value === null || value === undefined) return '-';
  const num = Number(value);
  if (Number.isNaN(num) || num === 0) return '-';
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(0)}K`;
  }
  return num.toString();
}

export function getContextWindow(params: Record<string, unknown>): string {
  return formatTokenCount(params?.context_window_size);
}

export function getMaxOutput(params: Record<string, unknown>): string {
  return formatTokenCount(params?.max_tokens);
}
