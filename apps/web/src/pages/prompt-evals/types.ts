import type {
  EvalRunDetail,
  EvalRunListItem,
} from "../../lib/api-client/prompt-evals";

export type { EvalRunDetail, EvalRunListItem };

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

export interface ModelOption {
  modelName: string;
  litellmParams: Record<string, unknown>;
}

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

export interface CaseMetrics {
  total: number;
  passed: number;
  failed: number;
  results: CaseResult[];
}
