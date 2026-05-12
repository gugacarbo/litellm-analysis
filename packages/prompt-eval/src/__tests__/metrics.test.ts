import { describe, expect, it } from "vitest";
import { calculateMetrics } from "../metrics/index.js";
import type { CategoryEvalCase, CategoryPrediction } from "../types/index.js";

describe("calculateMetrics", () => {
  it("returns perfect scores when all predictions match", () => {
    const labels = ["cat_a", "cat_b"];
    const cases: CategoryEvalCase[] = [
      { id: "1", input: "a", expectedCategories: ["cat_a"] },
      { id: "2", input: "b", expectedCategories: ["cat_b"] },
    ];
    const predictions: CategoryPrediction[] = [
      {
        caseId: "1",
        input: "a",
        expected: ["cat_a"],
        predicted: ["cat_a"],
        correct: true,
      },
      {
        caseId: "2",
        input: "b",
        expected: ["cat_b"],
        predicted: ["cat_b"],
        correct: true,
      },
    ];

    const result = calculateMetrics(labels, cases, predictions);

    expect(result.accuracy).toBe(1);
    expect(result.macroF1).toBe(1);
    expect(result.hammingLoss).toBe(0);
    expect(result.perLabel["cat_a"].f1).toBe(1);
    expect(result.perLabel["cat_b"].f1).toBe(1);
  });

  it("returns zero when all predictions are wrong", () => {
    const labels = ["cat_a", "cat_b"];
    const cases: CategoryEvalCase[] = [
      { id: "1", input: "a", expectedCategories: ["cat_a"] },
      { id: "2", input: "b", expectedCategories: ["cat_b"] },
    ];
    const predictions: CategoryPrediction[] = [
      {
        caseId: "1",
        input: "a",
        expected: ["cat_a"],
        predicted: ["cat_b"],
        correct: false,
      },
      {
        caseId: "2",
        input: "b",
        expected: ["cat_b"],
        predicted: ["cat_a"],
        correct: false,
      },
    ];

    const result = calculateMetrics(labels, cases, predictions);

    expect(result.macroF1).toBe(0);
    expect(result.accuracy).toBe(0);
    expect(result.hammingLoss).toBe(1);
  });

  it("handles multi-label correctly", () => {
    const labels = ["cat_a", "cat_b", "cat_c"];
    const cases: CategoryEvalCase[] = [
      { id: "1", input: "x", expectedCategories: ["cat_a", "cat_b"] },
      { id: "2", input: "y", expectedCategories: ["cat_b"] },
    ];
    const predictions: CategoryPrediction[] = [
      {
        caseId: "1",
        input: "x",
        expected: ["cat_a", "cat_b"],
        predicted: ["cat_a"],
        correct: false,
      },
      {
        caseId: "2",
        input: "y",
        expected: ["cat_b"],
        predicted: ["cat_b"],
        correct: true,
      },
    ];

    const result = calculateMetrics(labels, cases, predictions);

    expect(result.perLabel["cat_a"].f1).toBe(1);
    expect(result.perLabel["cat_a"].precision).toBe(1);
    expect(result.perLabel["cat_a"].recall).toBe(1);

    expect(result.perLabel["cat_b"].recall).toBe(0.5);
    expect(result.perLabel["cat_b"].precision).toBe(1);

    expect(result.perLabel["cat_c"].f1).toBe(0);

    expect(result.macroF1).toBeCloseTo(0.5556, 3);
    expect(result.hammingLoss).toBe(1 / 6);
  });

  it("handles edge case: no positive predictions for a label", () => {
    const labels = ["cat_a"];
    const cases: CategoryEvalCase[] = [
      { id: "1", input: "x", expectedCategories: ["cat_a"] },
    ];
    const predictions: CategoryPrediction[] = [
      {
        caseId: "1",
        input: "x",
        expected: ["cat_a"],
        predicted: [],
        correct: false,
      },
    ];

    const result = calculateMetrics(labels, cases, predictions);

    expect(result.perLabel["cat_a"].precision).toBe(0);
    expect(result.perLabel["cat_a"].recall).toBe(0);
    expect(result.perLabel["cat_a"].f1).toBe(0);
  });
});
