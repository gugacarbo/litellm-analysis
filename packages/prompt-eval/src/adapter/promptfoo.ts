import type {
  PromptEvalAdapter,
  EvalAdapterOptions,
  ClassifyInput,
  ClassifyOutput,
  ReviewInput,
  ReviewOutput,
} from "../types/index.js";

export function createPromptfooAdapter(
  _options: EvalAdapterOptions,
): PromptEvalAdapter {
  return {
    async classify(input: ClassifyInput): Promise<ClassifyOutput> {
      input.signal?.throwIfAborted();

      const start = Date.now();

      // Stub: return first category for any prompt (placeholder until Promptfoo integration)
      const predictedCategories = input.categories.length > 0
        ? [input.categories[0].id]
        : [];

      return {
        predictedCategories,
        rawResponse: JSON.stringify({ categories: predictedCategories }),
        latencyMs: Date.now() - start,
      };
    },

    async review(input: ReviewInput): Promise<ReviewOutput> {
      input.signal?.throwIfAborted();

      return {
        findings: input.cases.map((c) => ({
          caseId: c.caseId,
          input: c.input,
          expected: c.expectedCategories,
          predicted: c.predictedCategories,
          assessment: c.expectedCategories.some((e) => c.predictedCategories.includes(e))
            ? "correct" as const
            : "incorrect" as const,
          reasoning: "Stub review — Promptfoo integration pending",
        })),
        suggestions: [],
      };
    },
  };
}
