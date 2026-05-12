import type {
  EvalRunDetail,
  EvalRunListItem,
} from "../../lib/api-client/prompt-evals.js";

export type { EvalRunDetail, EvalRunListItem };

export interface EvalFormState {
  model: string;
  threshold: number;
}

export type SortField = "startedAt" | "macroF1" | "status" | "model";

export type SortDirection = "asc" | "desc";
