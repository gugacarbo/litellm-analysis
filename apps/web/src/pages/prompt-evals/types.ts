import type { EvalRunDetail } from "../../lib/api-client/prompt-evals";

export type { EvalRunDetail };

export interface EvalFormState {
  model: string;
  threshold: number;
}

export interface EvalInputCase {
  id: string;
  input: string;
  expectedCategories: string[];
}

export type SortField = "startedAt" | "macroF1" | "status" | "model";

export type SortDirection = "asc" | "desc";

export interface CategoryMetrics {
  category: string;
  precision: number | null;
  recall: number | null;
  f1: number | null;
  totalCases: number;
  matchedCases: number;
}

export interface CaseResult {
  id: string;
  input: string;
  expectedCategories: string[];
  predictedCategories: string[];
  passed: boolean;
}
