import { describe, expect, it } from "vitest";
import {
  applyUsageAdjustmentTotals,
  sumUsageAdjustments,
} from "./usage-adjustments";

describe("usage-adjustments presenter helpers", () => {
  it("sums adjustment deltas", () => {
    expect(
      sumUsageAdjustments([
        {
          id: "1",
          requestId: "req",
          reason: "a",
          promptTokensDelta: 1,
          completionTokensDelta: 2,
          totalCostDelta: 0.5,
          note: null,
          createdAt: new Date(),
        },
        {
          id: "2",
          requestId: "req",
          reason: "b",
          promptTokensDelta: 3,
          completionTokensDelta: 4,
          totalCostDelta: 0.25,
          note: null,
          createdAt: new Date(),
        },
      ]),
    ).toEqual({
      prompt_tokens_delta: 4,
      completion_tokens_delta: 6,
      total_cost_delta: 0.75,
    });
  });

  it("returns base values when no adjustments apply", () => {
    expect(
      applyUsageAdjustmentTotals(
        {
          input_tokens: 10,
          output_tokens: 5,
          total_tokens: 15,
          total_cost: 1,
        },
        {
          prompt_tokens_delta: 0,
          completion_tokens_delta: 0,
          total_cost_delta: 0,
        },
      ),
    ).toEqual({
      input_tokens: 10,
      output_tokens: 5,
      total_tokens: 15,
      total_cost: 1,
      has_usage_adjustments: false,
    });
  });
});
