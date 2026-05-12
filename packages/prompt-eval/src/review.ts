import type {
  AiReviewReport,
  CategoryDefinition,
  CategoryPrediction,
  EvalEvent,
  PromptEvalAdapter,
} from "./types/index.js";

export interface AiReviewInput {
  adapter: PromptEvalAdapter;
  categories: CategoryDefinition[];
  predictions: CategoryPrediction[];
  model: string;
  signal?: AbortSignal;
}

export async function runCategoryAiReview(
  input: AiReviewInput,
  onEvent?: (event: EvalEvent) => void,
): Promise<AiReviewReport> {
  const { adapter, categories, predictions, model, signal } = input;

  emit(onEvent, {
    type: "step:start",
    step: "reviewing",
    message: `Reviewing ${predictions.length} predictions...`,
  });
  signal?.throwIfAborted();

  const reviewOutput = await adapter.review({
    cases: predictions.map((p) => ({
      caseId: p.caseId,
      input: p.input,
      expectedCategories: p.expected,
      predictedCategories: p.predicted,
      categories,
    })),
    model,
    signal,
  });

  const report: AiReviewReport = {
    findings: reviewOutput.findings,
    suggestions: reviewOutput.suggestions,
    summary:
      reviewOutput.findings.length > 0
        ? `Reviewed ${reviewOutput.findings.length} cases. ${reviewOutput.findings.filter((f) => f.assessment === "incorrect").length} incorrect, ${reviewOutput.suggestions.length} suggestions.`
        : "No findings to review.",
  };

  emit(onEvent, { type: "step:end", step: "reviewing" });

  return report;
}

function emit(
  onEvent: ((event: EvalEvent) => void) | undefined,
  event: EvalEvent,
): void {
  if (onEvent) {
    try {
      onEvent(event);
    } catch {
      /* swallow */
    }
  }
}
