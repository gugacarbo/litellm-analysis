import type { CategoryEvalCase, CategoryEvalMetrics, CategoryPrediction, LabelMetrics } from "../types/index.js";

export function calculateMetrics(
  labels: string[],
  cases: CategoryEvalCase[],
  predictions: CategoryPrediction[],
): CategoryEvalMetrics {
  const caseMap = new Map(predictions.map((p) => [p.caseId, p]));
  const labelIndex = new Map(labels.map((l, i) => [l, i]));
  const n = labels.length;

  // Per-label TP/FP/FN (one-vs-rest)
  const perLabel: Record<string, LabelMetrics> = {};
  const confusion = Array.from({ length: n }, () => new Array(n).fill(0));
  let totalError = 0;
  let totalLabels = 0;
  let totalCorrect = 0;

  for (const c of cases) {
    const pred = caseMap.get(c.id);
    const expectedSet = new Set(c.expectedCategories);
    const predictedSet = new Set(pred?.predicted ?? []);

    totalLabels += n;

    for (const label of labels) {
      const expected = expectedSet.has(label);
      const predicted = predictedSet.has(label);
      if (expected !== predicted) totalError++;
    }

    const match = c.expectedCategories.length === (pred?.predicted.length ?? 0)
      && c.expectedCategories.every((l) => predictedSet.has(l));
    if (match) totalCorrect++;
  }

  for (const label of labels) {
    let tp = 0;
    let fp = 0;
    let fn = 0;

    for (const c of cases) {
      const pred = caseMap.get(c.id);
      const expected = c.expectedCategories.includes(label);
      const predicted = pred?.predicted.includes(label) ?? false;

      if (expected && predicted) tp++;
      else if (!expected && predicted) fp++;
      else if (expected && !predicted) fn++;
    }

    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;
    const f1 = precision + recall > 0
      ? (2 * precision * recall) / (precision + recall)
      : 0;

    perLabel[label] = {
      precision,
      recall,
      f1,
      support: cases.filter((c) => c.expectedCategories.includes(label)).length,
    };
  }

  // Confusion matrix (multi-label: sum of label co-occurrences)
  for (const c of cases) {
    const pred = caseMap.get(c.id);
    for (const expectedLabel of c.expectedCategories) {
      const i = labelIndex.get(expectedLabel);
      if (i === undefined) continue;
      for (const predictedLabel of pred?.predicted ?? []) {
        const j = labelIndex.get(predictedLabel);
        if (j !== undefined) confusion[i][j]++;
      }
    }
  }

  const f1Values = Object.values(perLabel).map((m) => m.f1);
  const macroF1 = f1Values.length > 0
    ? f1Values.reduce((sum, v) => sum + v, 0) / f1Values.length
    : 0;

  return {
    accuracy: cases.length > 0 ? totalCorrect / cases.length : 0,
    macroF1,
    perLabel,
    hammingLoss: totalLabels > 0 ? totalError / totalLabels : 0,
    confusionMatrix: confusion,
  };
}
