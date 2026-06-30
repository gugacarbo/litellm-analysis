import type { ChatMessage } from "./index";

interface ProxyUsageAdjustment {
  id: string;
  reason: string;
  prompt_tokens_delta: number;
  completion_tokens_delta: number;
  total_cost_delta: number;
  note: string | null;
  created_at: string;
}

/** Native proxy ledger contract (replaces deprecated SpendLogEntry). */
export interface ProxyRequestLog {
  id: string;
  model: string;
  upstream_model: string;
  upstream_base_url: string;
  status: string;
  started_at: string;
  finished_at: string | null;
  latency_ms: number | null;
  ttft_ms: number | null;
  input_tokens: number | null;
  output_tokens: number | null;
  total_tokens: number | null;
  cached_tokens: number | null;
  reasoning_tokens: number | null;
  usage_estimated: boolean;
  cost_estimated: boolean;
  input_cost_per_token: number | null;
  output_cost_per_token: number | null;
  input_cost: number | null;
  output_cost: number | null;
  total_cost: number | null;
  estimated_cost_usd: number | null;
  has_usage_adjustments?: boolean;
  usage_adjustments?: ProxyUsageAdjustment[];
  api_key_alias: string | null;
  end_user: string | null;
  error_type: string | null;
  error_message: string | null;
  error_status_code: number | null;
  error_summary: string | null;
  error_details?: Record<string, unknown> | null;
  request_body: Record<string, unknown> | null;
  response_body: Record<string, unknown> | null;
  response_headers?: Record<string, unknown> | null;
  messages: ChatMessage[];
}

export type ProxyRequestLogListItem = Omit<
  ProxyRequestLog,
  "error_details" | "response_headers"
>;
