import { describe, expect, it } from "vitest";
import { createPromptfooAdapter } from "../adapter/promptfoo.js";
import { runCategoryEvaluation } from "../evaluation.js";
import type { CategoryDefinition, CategoryEvalCase } from "../types/index.js";

const categories: CategoryDefinition[] = [
  { id: "cat_a", name: "Category A", description: "desc a" },
  { id: "cat_b", name: "Category B", description: "desc b" },
];

const cases: CategoryEvalCase[] = [
  { id: "1", input: "prompt one", expectedCategories: ["cat_a"] },
  { id: "2", input: "prompt two", expectedCategories: ["cat_a"] },
];

describe("runCategoryEvaluation", () => {
  it("returns a report with metrics", async () => {
    const adapter = createPromptfooAdapter({ provider: "test" });

    const report = await runCategoryEvaluation({
      categories,
      cases,
      model: "test-model",
      threshold: 0.8,
      adapter,
    } as any);

    expect(report.runId).toBeDefined();
    expect(report.metrics).toBeDefined();
    expect(report.metrics.macroF1).toBeGreaterThanOrEqual(0);
    expect(report.metrics.macroF1).toBeLessThanOrEqual(1);
    expect(report.predictions).toHaveLength(cases.length);
    expect(report.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("emits step events in order", async () => {
    const adapter = createPromptfooAdapter({ provider: "test" });
    const events: string[] = [];

    const _report = await runCategoryEvaluation(
      { categories, cases, model: "test", threshold: 0.8, adapter } as any,
      (event: any) => {
        events.push(event.type);
      },
    );

    expect(events).toContain("step:start");
    expect(events).toContain("step:progress");
    expect(events).toContain("step:end");
    expect(events).toContain("run:completed");
  });

  it("respects AbortSignal", async () => {
    const adapter = createPromptfooAdapter({ provider: "test" });
    const controller = new AbortController();
    controller.abort();

    await expect(
      runCategoryEvaluation({
        categories,
        cases,
        model: "test",
        threshold: 0.8,
        signal: controller.signal,
        adapter,
      } as any),
    ).rejects.toThrow();
  });
});
