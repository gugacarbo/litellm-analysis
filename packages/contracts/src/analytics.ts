export interface SpendByModel {
  model: string;
  total_spend: number;
}

export interface PaginationMetadata {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ChatToolCall {
  id: string;
  type: string;
  function?: {
    name?: string;
    arguments?: string;
  };
}

export type ChatMessageContentPart = {
  type?: string;
  text?: string;
  image_url?: {
    url?: string;
  };
};

export interface ChatMessage {
  role: string;
  content?: string | ChatMessageContentPart[] | null;
  tool_calls?: ChatToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface SpendLog {
  request_id: string;
  model: string;
  user: string;
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
  spend: number;
  time_to_first_token_ms: number | null;
  start_time: string;
  end_time: string;
  api_key: string;
  status: string;
  call_type?: string;
  completion_start_time?: string;
  model_id?: string;
  model_group?: string;
  api_base?: string;
  cache_hit?: string;
  cache_key?: string;
  request_tags?: string[];
  team_id?: string;
  end_user?: string;
  requester_ip_address?: string;
  metadata?: Record<string, unknown>;
  proxy_server_request?: Record<string, unknown>;
  response?: Record<string, unknown>;
  session_id?: string;
  mcp_namespaced_tool_name?: string;
  organization_id?: string;
  agent_id?: string;
  request_duration_ms?: number;
  messages?: ChatMessage[];
}

export interface SpendLogWithError extends SpendLog {
  error_type?: string;
  error_message?: string;
  error_status_code?: number;
  error_exception_string?: string;
  request_kwargs?: Record<string, unknown>;
  upstream_model_name?: string;
}

export interface UserSpend {
  user: string;
  total_spend: number;
  total_tokens: number;
  request_count: number;
}

export interface KeySpend {
  key: string;
  total_spend: number;
  total_tokens: number;
}

export interface DailySpend {
  date: string;
  spend: number;
  tokens: number;
}

export interface DashboardFilters {
  startDate?: string;
  endDate?: string;
  model?: string;
  user?: string;
}

export interface ModelDetail {
  model_name: string;
  input_cost_per_token: string;
  output_cost_per_token: string;
}

export interface ModelRoute {
  modelName: string;
  enabled?: boolean;
  displayName?: string;
  family?: string;
  ownedBy?: string;
  apiMode?: "openai" | "anthropic";
  vision?: boolean;
  contextWindowSize?: number;
  maxOutputTokens?: number;
  inputCostPerToken?: number;
  outputCostPerToken?: number;
  upstreamModel?: string;
  upstreamBaseUrl?: string;
  providerName?: string;
  secretRef?: string;
  requestOptions?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface ModelConfig {
  modelName: string;
  modelRoute: ModelRoute;
}

export interface ModelStatistics {
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
}

export interface ErrorLog {
  id: string;
  error_type: string;
  model: string;
  user: string;
  error_message: string;
  api_key: string | null;
  spend_status: string | null;
  timestamp: string;
  status_code: number;
  upstream_model_name: string | null;
  request_kwargs: Record<string, unknown> | null;
  total_tokens: number | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  spend: number | null;
  end_time: string | null;
}

export interface MetricsSummary {
  totalSpend: number;
  totalTokens: number;
  activeModels: number;
  errorCount: number;
}

export interface PerformanceMetrics {
  total_requests: number;
  avg_duration_ms: number;
  success_rate: number;
}

export interface TokenDistribution {
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  avg_tokens_per_request: number;
  input_output_ratio: number;
}

export interface HourlyPattern {
  hour: number;
  request_count: number;
  total_spend: number;
  total_tokens: number;
}

export interface KeyAnalytics {
  key: string;
  request_count: number;
  total_spend: number;
  total_tokens: number;
  avg_tokens_per_request: number;
  success_rate: number;
  last_used: string;
}

export interface CostEfficiency {
  model: string;
  total_spend: number;
  total_tokens: number;
  cost_per_1k_tokens: number;
  request_count: number;
}

export interface ModelDistribution {
  model: string;
  request_count: number;
  percentage: number;
}

export interface DailyTokenTrend {
  date: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  request_count: number;
}
