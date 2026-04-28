export interface ModelStats {
  model: string;
  request_count: number;
  total_spend: number;
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
  avg_tokens_per_request: number;
  avg_latency_ms: number;
  success_rate: number;
  error_count: number;
  avg_input_cost: number;
  avg_output_cost: number;
  p50_latency_ms: number;
  p95_latency_ms: number;
  p99_latency_ms: number;
  first_seen: string;
  last_seen: string;
  unique_users: number;
  unique_api_keys: number;
  p50_tokens_per_second: number;
}

export type SortField =
  | "model"
  | "request_count"
  | "total_spend"
  | "total_tokens"
  | "avg_latency_ms"
  | "success_rate"
  | "error_count"
  | "avg_tokens_per_request";

export type SortDirection = "asc" | "desc";

export type ColumnKey =
  | "model"
  | "requests"
  | "spend"
  | "percent"
  | "tokens"
  | "prompt"
  | "output"
  | "avgTok"
  | "tokPerSec"
  | "latency"
  | "p50"
  | "p95"
  | "p99"
  | "success"
  | "errors"
  | "errorRate"
  | "users"
  | "keys"
  | "first"
  | "last"
  | "costPer1k"
  | "actions";

export interface Column {
  key: ColumnKey;
  label: string;
  sortable?: SortField;
  align?: "left" | "right";
  default: boolean;
}

export interface ModelInsight {
  label: string;
  value: string;
  detail: string;
  tone: "positive" | "warning" | "negative" | "neutral";
}

export const MODEL_STATS_COLUMNS: Column[] = [
  { key: "model", label: "Model", default: true },
  {
    key: "requests",
    label: "Requests",
    sortable: "request_count",
    align: "right",
    default: true,
  },
  {
    key: "spend",
    label: "Spend",
    sortable: "total_spend",
    align: "right",
    default: true,
  },
  { key: "percent", label: "% Total", align: "right", default: true },
  {
    key: "tokens",
    label: "Tokens",
    sortable: "total_tokens",
    align: "right",
    default: true,
  },
  { key: "prompt", label: "Prompt", align: "right", default: false },
  { key: "output", label: "Output", align: "right", default: false },
  {
    key: "avgTok",
    label: "Avg Tok/Req",
    sortable: "avg_tokens_per_request",
    align: "right",
    default: false,
  },
  {
    key: "tokPerSec",
    label: "Out tok/s (p50)",
    align: "right",
    default: true,
  },
  { key: "p50", label: "Latency (p50)", align: "right", default: false },
  { key: "p95", label: "Latency (p95)", align: "right", default: false },
  { key: "p99", label: "Latency (p99)", align: "right", default: false },
  {
    key: "success",
    label: "Success",
    sortable: "success_rate",
    align: "right",
    default: true,
  },
  { key: "errors", label: "Errors", align: "right", default: false },
  { key: "errorRate", label: "Error Rate", align: "right", default: false },
  { key: "costPer1k", label: "$/1K tok", align: "right", default: false },
  { key: "users", label: "Users", align: "right", default: false },
  { key: "keys", label: "API Keys", align: "right", default: false },
  { key: "first", label: "First Used", align: "right", default: false },
  { key: "last", label: "Last Used", align: "right", default: false },
  { key: "actions", label: "", align: "right", default: true },
];
