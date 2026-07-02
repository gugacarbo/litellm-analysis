import type { UsageSummary } from "./usage-extractor";

export interface CostRates {
  input?: number;
  output?: number;
}

export interface CostSnapshot {
  costEstimated?: boolean;
  estimatedCostUsd?: number;
  inputCost?: number;
  inputCostPerToken?: number;
  outputCost?: number;
  outputCostPerToken?: number;
  totalCost?: number;
}

export function calculateCost(
  rates: CostRates,
  usage: UsageSummary,
): CostSnapshot {
  const inputCostPerToken = rates.input;
  const outputCostPerToken = rates.output;

  const inputCost =
    usage.inputTokens !== undefined && inputCostPerToken !== undefined
      ? usage.inputTokens * inputCostPerToken
      : undefined;
  const outputCost =
    usage.outputTokens !== undefined && outputCostPerToken !== undefined
      ? usage.outputTokens * outputCostPerToken
      : undefined;

  const total =
    (inputCost ?? 0) + (outputCost ?? 0) > 0
      ? (inputCost ?? 0) + (outputCost ?? 0)
      : undefined;

  return {
    inputCostPerToken,
    outputCostPerToken,
    inputCost,
    outputCost,
    totalCost: total,
    estimatedCostUsd: total,
    costEstimated: usage.usageEstimated === true ? true : undefined,
  };
}
