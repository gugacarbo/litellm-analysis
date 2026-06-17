import type { ModelProxyUsageAdjustment } from "@lite-llm/model-proxy-repository";

export interface UsageAdjustmentTotals {
  prompt_tokens_delta: number;
  completion_tokens_delta: number;
  total_cost_delta: number;
}

export function sumUsageAdjustments(
  adjustments: ModelProxyUsageAdjustment[],
): UsageAdjustmentTotals {
  return adjustments.reduce(
    (totals, row) => ({
      prompt_tokens_delta: totals.prompt_tokens_delta + row.promptTokensDelta,
      completion_tokens_delta:
        totals.completion_tokens_delta + row.completionTokensDelta,
      total_cost_delta: totals.total_cost_delta + row.totalCostDelta,
    }),
    {
      prompt_tokens_delta: 0,
      completion_tokens_delta: 0,
      total_cost_delta: 0,
    },
  );
}

export function applyUsageAdjustmentTotals(
  base: {
    input_tokens: number | null;
    output_tokens: number | null;
    total_tokens: number | null;
    total_cost: number | null;
  },
  deltas: UsageAdjustmentTotals,
): {
  input_tokens: number | null;
  output_tokens: number | null;
  total_tokens: number | null;
  total_cost: number | null;
  has_usage_adjustments: boolean;
} {
  const has_usage_adjustments =
    deltas.prompt_tokens_delta !== 0 ||
    deltas.completion_tokens_delta !== 0 ||
    deltas.total_cost_delta !== 0;

  if (!has_usage_adjustments) {
    return { ...base, has_usage_adjustments: false };
  }

  const input_tokens =
    base.input_tokens === null && deltas.prompt_tokens_delta === 0
      ? null
      : (base.input_tokens ?? 0) + deltas.prompt_tokens_delta;
  const output_tokens =
    base.output_tokens === null && deltas.completion_tokens_delta === 0
      ? null
      : (base.output_tokens ?? 0) + deltas.completion_tokens_delta;
  const total_tokens =
    base.total_tokens === null &&
    deltas.prompt_tokens_delta === 0 &&
    deltas.completion_tokens_delta === 0
      ? null
      : (base.total_tokens ?? 0) +
        deltas.prompt_tokens_delta +
        deltas.completion_tokens_delta;
  const total_cost =
    base.total_cost === null && deltas.total_cost_delta === 0
      ? null
      : (base.total_cost ?? 0) + deltas.total_cost_delta;

  return {
    input_tokens,
    output_tokens,
    total_tokens,
    total_cost,
    has_usage_adjustments: true,
  };
}
