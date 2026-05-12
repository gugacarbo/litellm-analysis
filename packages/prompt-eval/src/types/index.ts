// @lite-llm/prompt-eval — Public types

// --- Dataset types ---

export interface CategoryDefinition {
  id: string;
  name: string;
  description: string;
}

export interface CategoryEvalCase {
  id: string;
  input: string;
  expectedCategories: string[];
  notes?: string;
}

export interface CategoryEvalDataset {
  version: number;
  description: string;
  cases: CategoryEvalCase[];
}

// --- Adapter types ---

export interface EvalAdapterOptions {
  provider: string;
  apiKey?: string;
  baseUrl?: string;
}

export interface ClassifyInput {
  categories: CategoryDefinition[];
  prompt: string;
  model: string;
  signal?: AbortSignal;
}

export interface ClassifyOutput {
  predictedCategories: string[];
  rawResponse: string;
  latencyMs: number;
}

export interface ReviewInput {
  cases: Array<{
    caseId: string;
    input: string;
    expectedCategories: string[];
    predictedCategories: string[];
    categories: CategoryDefinition[];
  }>;
  model: string;
  signal?: AbortSignal;
}

export interface ReviewOutput {
  findings: AiReviewFinding[];
  suggestions: AiReviewSuggestion[];
}

export interface PromptEvalAdapter {
  classify(input: ClassifyInput): Promise<ClassifyOutput>;
  review(input: ReviewInput): Promise<ReviewOutput>;
}

// --- Input/Output types ---

export interface CategoryEvalInput {
  categories: CategoryDefinition[];
  cases: CategoryEvalCase[];
  model: string;
  threshold: number;
  signal?: AbortSignal;
}

export interface CategoryEvalReport {
  runId: string;
  model: string;
  threshold: number;
  metrics: CategoryEvalMetrics;
  predictions: CategoryPrediction[];
  durationMs: number;
}

export interface CategoryEvalMetrics {
  accuracy: number;
  macroF1: number;
  perLabel: Record<string, LabelMetrics>;
  hammingLoss: number;
  confusionMatrix: number[][];
}

export interface LabelMetrics {
  precision: number;
  recall: number;
  f1: number;
  support: number;
}

export interface CategoryPrediction {
  caseId: string;
  input: string;
  expected: string[];
  predicted: string[];
  correct: boolean;
}

// --- Review types ---

export interface AiReviewFinding {
  caseId: string;
  input: string;
  expected: string[];
  predicted: string[];
  assessment: "correct" | "incorrect" | "ambiguous";
  reasoning: string;
}

export interface AiReviewSuggestion {
  categoryId: string;
  currentDescription: string;
  suggestedDescription: string;
  rationale: string;
}

export interface AiReviewReport {
  findings: AiReviewFinding[];
  suggestions: AiReviewSuggestion[];
  summary: string;
}

// --- Event types (EventEmitter) ---

export type EvalStep =
  | "loading_dataset"
  | "classifying"
  | "scoring"
  | "reviewing"
  | "reporting";

export type EvalRunStatus =
  | "queued"
  | "loading_dataset"
  | "classifying"
  | "scoring"
  | "reviewing"
  | "reporting"
  | "succeeded"
  | "failed"
  | "cancelled";

export type EvalEvent =
  | { type: "step:start"; step: EvalStep; message: string }
  | { type: "step:progress"; step: EvalStep; progressPct: number; message: string }
  | { type: "step:end"; step: EvalStep }
  | { type: "run:completed"; report: CategoryEvalReport }
  | { type: "run:failed"; error: string };

// --- Persistence entities (DB rows) ---

export interface EvalRun {
  id: string;
  type: "category_eval";
  status: EvalRunStatus;
  model: string;
  macroF1: number | null;
  threshold: number;
  error: string | null;
  startedAt: number;
  finishedAt: number | null;
}

export interface EvalRunStep {
  id: number;
  runId: string;
  step: EvalStep;
  status: "pending" | "running" | "completed" | "failed";
  startedAt: number;
  finishedAt: number | null;
  message: string | null;
  progressPct: number;
}

export interface EvalRunArtifact {
  id: number;
  runId: string;
  kind: "eval_report_json" | "eval_report_md" | "review_report_json" | "review_report_md";
  path: string;
  summaryJson: string | null;
}
