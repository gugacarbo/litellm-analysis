import { randomUUID } from "node:crypto";
import { validateDataset } from "./dataset";
import { calculateMetrics } from "./metrics/index";
import type {
  CategoryEvalInput,
  CategoryEvalReport,
  CategoryPrediction,
  EvalEvent,
  PromptEvalAdapter,
} from "./types/index";

export async function runCategoryEvaluation(
  input: CategoryEvalInput & { adapter: PromptEvalAdapter },
  onEvent?: (event: EvalEvent) => void,
): Promise<CategoryEvalReport> {
  const runId = input.runId ?? randomUUID();
  const { categories, cases, model, threshold, signal, adapter } = input;

  signal?.throwIfAborted();
  const validation = validateDataset(
    { version: 1, description: "runtime", cases },
    categories,
  );
  if (!validation.valid) {
    throw new Error(`Invalid dataset: ${validation.errors.join("; ")}`);
  }

  emit(onEvent, {
    type: "step:start",
    step: "classifying",
    message: `Classifying ${cases.length} prompts...`,
  });
  signal?.throwIfAborted();

  const predictions: CategoryPrediction[] = [];
  const totalCases = cases.length;

  for (let i = 0; i < totalCases; i++) {
    signal?.throwIfAborted();
    const c = cases[i];
    const classifyOutput = await adapter.classify({
      categories,
      prompt: c.input,
      model,
      signal,
    });

    const predictedCats = classifyOutput.predictedCategories.filter((id) =>
      categories.some((cat) => cat.id === id),
    );

    predictions.push({
      caseId: c.id,
      input: c.input,
      expected: c.expectedCategories,
      predicted: predictedCats,
      correct: arraysEqual(
        new Set(c.expectedCategories),
        new Set(predictedCats),
      ),
    });

    emit(onEvent, {
      type: "step:progress",
      step: "classifying",
      progressPct: Math.round(((i + 1) / totalCases) * 100),
      message: `Classified ${i + 1}/${totalCases}`,
    });
  }
  emit(onEvent, { type: "step:end", step: "classifying" });

  emit(onEvent, {
    type: "step:start",
    step: "scoring",
    message: "Calculating metrics...",
  });
  signal?.throwIfAborted();

  const labels = categories.map((c) => c.id);
  const metrics = calculateMetrics(labels, cases, predictions);

  emit(onEvent, { type: "step:end", step: "scoring" });

  emit(onEvent, {
    type: "step:start",
    step: "reporting",
    message: "Generating report...",
  });
  signal?.throwIfAborted();

  const report: CategoryEvalReport = {
    runId,
    model,
    threshold,
    metrics,
    predictions,
    durationMs: 0,
  };

  emit(onEvent, { type: "step:end", step: "reporting" });
  emit(onEvent, { type: "run:completed", report });

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

function arraysEqual(a: Set<string>, b: Set<string>): boolean {
  if (a.size !== b.size) return false;
  for (const item of a) {
    if (!b.has(item)) return false;
  }
  return true;
}
