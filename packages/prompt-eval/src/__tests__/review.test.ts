import { describe, expect, it } from "vitest";
import { createPromptfooAdapter } from "../adapter/promptfoo";
import { runCategoryAiReview } from "../review";
import type {
  CategoryDefinition,
  CategoryPrediction,
  EvalEvent,
} from "../types/index";

const categories: CategoryDefinition[] = [
  { id: "cat_a", name: "A", description: "desc a" },
  { id: "cat_b", name: "B", description: "desc b" },
];

const predictions: CategoryPrediction[] = [
  {
    caseId: "1",
    input: "test",
    expected: ["cat_a"],
    predicted: ["cat_b"],
    correct: false,
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
    expect(["correct", "incorrect", "ambiguous"]).toContain(
      report.findings[0].assessment,
    );
  });

  it("emits review steps", async () => {
    const adapter = createPromptfooAdapter({ provider: "test" });
    const events: string[] = [];

    await runCategoryAiReview(
      { adapter, categories, predictions, model: "test" },
      (event: EvalEvent) => {
        events.push(event.type);
      },
    );

    expect(events).toContain("step:start");
    expect(events).toContain("step:end");
  });
});
