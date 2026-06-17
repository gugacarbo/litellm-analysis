import { describe, expect, it } from "vitest";
import { calculateCost } from "./cost-calculator";

describe("cost-calculator", () => {
  it("calculates decomposed costs and snapshots rates", () => {
    const snapshot = calculateCost(
      { input: 0.000001, output: 0.000002 },
      { inputTokens: 10, outputTokens: 5 },
    );

    expect(snapshot.inputCostPerToken).toBe(0.000001);
    expect(snapshot.outputCostPerToken).toBe(0.000002);
    expect(snapshot.inputCost).toBeCloseTo(0.00001);
    expect(snapshot.outputCost).toBeCloseTo(0.00001);
    expect(snapshot.totalCost).toBeCloseTo(0.00002);
    expect(snapshot.estimatedCostUsd).toBeCloseTo(0.00002);
    expect(snapshot.costEstimated).toBeUndefined();
  });

  it("marks cost as estimated when usage was estimated", () => {
    const snapshot = calculateCost(
      { input: 0.000001, output: 0.000002 },
      { inputTokens: 10, outputTokens: 5, usageEstimated: true },
    );

    expect(snapshot.costEstimated).toBe(true);
  });
});
