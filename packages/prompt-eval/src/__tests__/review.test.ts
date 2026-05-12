import { describe, it, expect } from "vitest";
import { runCategoryAiReview } from "../review.js";
import { createPromptfooAdapter } from "../adapter/promptfoo.js";
import type { CategoryDefinition, CategoryPrediction } from "../types/index.js";

const categories: CategoryDefinition[] = [
  { id: "cat_a", name: "A", description: "desc a" },
  { id: "cat_b", name: "B", description: "desc b" },
];

const predictions: CategoryPrediction[] = [
  {
    caseId: "1", input: "test", expected: ["cat_a"],
    predicted: ["cat_b"], correct: false,
  },
];

describe("runCategoryAiReview", () => {
  it("returns findings for each case", async () => {
    const adapter = createPromptfooAdapter({ provider: "test" });
    const report = await runCategoryAiReview({
      adapter,
      categories,
      predictions,
      model: "test-model",
    });

    expect(report.findings).toHaveLength(predictions.length);
    expect(report.findings[0].caseId).toBe("1");
    expect(["correct", "incorrect", "ambiguous"]).toContain(report.findings[0].assessment);
  });

  it("emits review steps", async () => {
    const adapter = createPromptfooAdapter({ provider: "test" });
    const events: string[] = [];

    await runCategoryAiReview(
      { adapter, categories, predictions, model: "test" },
      (event: any) => { events.push(event.type); },
    );

    expect(events).toContain("step:start");
    expect(events).toContain("step:end");
  });
});
