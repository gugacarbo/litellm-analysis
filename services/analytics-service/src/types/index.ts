// Analytics Data Source Interface
import type { ProxyRequestLog } from "./proxy-request-log";

// Granularity identifiers for time-series bucketing
export type TimeGranularity =
  | "30s"
  | "1m"
  | "1h"
  | "1d"
  | "2d"
  | "1w"
  | "2w"
  | "1mo";

/** Base type for all time-series data points with adaptive granularity */
export interface TimeSeriesPoint {
  date: string;
  granularity: TimeGranularity;
}

/**
 * Time range parameters for queries.
 * Use either days (relative) OR startDate/endDate (absolute).
 */
export type TimeRangeParams = {
  days?: number;
  startDate?: string;
  endDate?: string;
};

/** @deprecated Use TimeRangeParams instead */
export type LegacyTimeRangeParams = number | undefined;

export interface AnalyticsDataSource {
  getMetricsSummary(params?: TimeRangeParams): Promise<MetricsSummary>;
  getDailySpendTrend(params?: TimeRangeParams): Promise<DailySpendTrend[]>;
  getHourlySpendTrend(days?: number): Promise<HourlySpendTrend[]>;
  getSpendByModel(params?: TimeRangeParams): Promise<SpendByModel[]>;
  getSpendByUser(params?: TimeRangeParams): Promise<SpendByUser[]>;
  getSpendByKey(days?: number): Promise<SpendByKey[]>;
  getSpendLogs(filters: SpendLogsFilters): Promise<SpendLogsResponse>;
  getSpendLogsCount(filters: SpendLogsFilters): Promise<number>;
  getSpendLogDetail(requestId: string): Promise<ProxyRequestLog>;
  getSpendTotals(
    filters: Pick<SpendLogsFilters, "model" | "startDate" | "endDate">,
  ): Promise<SpendTotals>;
  getTokenDistribution(params?: TimeRangeParams): Promise<TokenDistribution[]>;
  getPerformanceMetrics(params?: TimeRangeParams): Promise<PerformanceMetrics>;
  getHourlyUsagePatterns(
    params?: TimeRangeParams,
  ): Promise<HourlyUsagePattern[]>;
  getApiKeyStats(params?: TimeRangeParams): Promise<ApiKeyStats[]>;
  getCostEfficiency(params?: TimeRangeParams): Promise<CostEfficiency[]>;
  getModelDistribution(
    params?: TimeRangeParams,
  ): Promise<ModelRequestDistribution[]>;
  getDailyTokenTrend(params?: TimeRangeParams): Promise<DailyTokenTrend[]>;
  getModelStatistics(params?: TimeRangeParams): Promise<ModelStatistics[]>;
  getDailySpendTrendByModel(
    model: string,
    days?: number,
  ): Promise<ModelDailySpendTrend[]>;
  getDailyTokenTrendByModel(
    model: string,
    days?: number,
  ): Promise<ModelDailyTokenTrend[]>;
  getHourlyUsageByModel(
    model: string,
    days?: number,
  ): Promise<ModelHourlyUsage[]>;
  getDailyLatencyTrendByModel(
    model: string,
    days?: number,
  ): Promise<ModelDailyLatencyTrend[]>;
  getErrorBreakdownByModel(
    model: string,
    days?: number,
  ): Promise<ModelErrorBreakdown[]>;
  getDailyErrorTrendByModel(
    model: string,
    days?: number,
  ): Promise<ModelDailyErrorTrend[]>;
  getModels(): Promise<ModelEntry[]>;
  getModelDetails(): Promise<ModelDetail[]>;
  getErrorLogs(limit: number, days?: number): Promise<ErrorLogEntry[]>;
  createModel(model: {
    modelName: string;
    litellmParams: Record<string, unknown>;
  }): Promise<void>;
  updateModel(
    modelName: string,
    updates: { litellmParams?: Record<string, unknown>; modelName?: string },
  ): Promise<void>;
  deleteModel(modelName: string): Promise<void>;
  mergeModels(sourceModel: string, targetModel: string): Promise<void>;
  deleteModelLogs(modelName: string): Promise<void>;
  getAgentRoutingConfig(): Promise<Record<string, unknown> | null>;
  updateAgentRoutingConfig(config: Record<string, unknown>): Promise<void>;
  getTopUsersByModel(model: string, days?: number): Promise<ModelTopUser[]>;
  getTopApiKeysByModel(model: string, days?: number): Promise<ModelTopApiKey[]>;
  // Monitor queries — used by anomaly detection system
  getErrorsSince(since: Date, limit?: number): Promise<ErrorLogEntry[]>;
  getErrorCountByModelSince(since: Date): Promise<ModelErrorCountSince[]>;
  getNonSuccessCountByModelSince(
    since: Date,
  ): Promise<NonSuccessCountByModel[]>;
  getModelHealthSince(
    model: string,
    since: Date,
    baselineHours: number,
  ): Promise<ModelHealth>;
  getStuckRequests(since: Date): Promise<StuckRequest[]>;
  getCacheHitRateByModel(
    model: string,
    days?: number,
  ): Promise<ModelCacheHitRate>;
  getTTFTPercentilesByModel(
    model: string,
    days?: number,
  ): Promise<ModelTTFTPercentiles>;
  getStatusDistributionByModel(
    model: string,
    days?: number,
  ): Promise<ModelStatusDistribution[]>;
  getProviderBreakdownByModel(
    model: string,
    days?: number,
  ): Promise<ModelProviderBreakdown[]>;
  // Credentials — LiteLLM virtual key management
  getCredentials(): Promise<LiteLLMCredential[]>;
  getDefaultCredential(): Promise<string | null>;
  getHealthCheckPrompt(): Promise<string | null>;
  setDefaultCredential(credentialAlias: string | null): Promise<void>;
}

// Analytics Types
export interface SpendByModel {
  model: string;
  total_spend: number;
}

export interface SpendByUser {
  user: string | null;
  total_spend: number;
  total_tokens: number;
  request_count: number;
}

export interface SpendByKey {
  key: string | null;
  total_spend: number;
  total_tokens: number;
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

/** @deprecated Use ProxyRequestLog. Not exposed on HTTP routes (Batch 5). */
export interface SpendLogEntry {
  request_id: string;
  model: string;
  user: string | null;
  total_tokens: number | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  spend: number;
  time_to_first_token_ms: number | null;
  start_time: string;
  end_time: string | null;
  api_key: string | null;
  status: string;
  call_type?: string | null;
  api_base?: string | null;
  team_id?: string | null;
  end_user?: string | null;
  organization_id?: string | null;
  completion_start_time?: string | null;
  request_duration_ms?: number | null;
  cache_hit?: string | null;
  cache_key?: string | null;
  metadata?: Record<string, unknown> | null;
  proxy_server_request?: Record<string, unknown> | null;
  response?: Record<string, unknown> | null;
  request_tags?: string[] | null;
  requester_ip_address?: string | null;
  session_id?: string | null;
  agent_id?: string | null;
  model_id?: string | null;
  model_group?: string | null;
  custom_llm_provider?: string | null;
  mcp_namespaced_tool_name?: string | null;
  messages?: ChatMessage[] | null;
}

export interface ErrorLogEntry {
  litellm_model_name: string | null;
  request_kwargs: Record<string, unknown> | null;
  id: string;
  error_type: string | null;
  model: string | null;
  user: string | null;
  error_message: string | null;
  timestamp: string;
  status_code: number | null;
  api_key: string | null;
  spend_status: string | null;
  total_tokens: number | null;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  spend: number | null;
  end_time: string | null;
}

export interface ModelDetail {
  model_name: string;
  input_cost_per_token: string | null;
  output_cost_per_token: string | null;
}

export interface MetricsSummaryResult {
  total_spend: number;
  total_tokens: number;
  active_models: number;
  error_count: number;
  distinct_models?: string[];
  prompt_tokens: number;
  completion_tokens: number;
}

export type MetricsSummary = MetricsSummaryResult;

/**
 * Spend trend with automatic granularity.
 * For ranges < 1 day: date is formatted as "YYYY-MM-DD HH24:MI" (hourly)
 * For ranges >= 1 day: date is formatted as "YYYY-MM-DD" (daily)
 */
export interface DailySpendTrend {
  date: string;
  spend: number;
  granularity?: TimeGranularity;
}

/**
 * Hourly spend trend for short time ranges.
 * Groups by hour with full timestamp for accurate charting.
 */
export interface HourlySpendTrend {
  timestamp: string;
  hour: number;
  spend: number;
  total_tokens: number;
  request_count: number;
}

export interface TokenDistribution {
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  avg_tokens_per_request: number;
  input_output_ratio: number;
}

export interface PerformanceMetricsResult {
  total_requests: number;
  avg_duration_ms: number;
  success_rate: number;
  avg_tokens_per_second: number;
}

export type PerformanceMetrics = PerformanceMetricsResult;

export interface HourlyUsagePattern {
  hour: number;
  request_count: number;
  total_spend: number;
  total_tokens: number;
}

export interface ApiKeyStats {
  key: string | null;
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

export type ModelRequestDistribution = ModelDistribution;

/**
 * Token trend with automatic granularity.
 * For ranges < 1 day: date is formatted as "YYYY-MM-DD HH24:MI" (hourly)
 * For ranges >= 1 day: date is formatted as "YYYY-MM-DD" (daily)
 */
export interface DailyTokenTrend {
  date: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  request_count: number;
  granularity?: TimeGranularity;
}

export interface ModelStatistics {
  model: string;
  request_count: number;
  total_spend: number;
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
  avg_tokens_per_request: number;
  avg_latency_ms: number | null;
  success_rate: number | null;
  error_count: number;
  distinct_models?: string[];
  avg_input_cost: number | null;
  avg_output_cost: number | null;
  p50_latency_ms: number | null;
  p95_latency_ms: number | null;
  p99_latency_ms: number | null;
  first_seen: string | null;
  last_seen: string | null;
  unique_users: number;
  unique_api_keys: number;
  p50_tokens_per_second: number;
  avg_tokens_per_second: number;
  max_tokens_per_second: number;
}

export interface ModelInfo {
  modelName: string;
  modelRoute: Record<string, unknown>;
  /** @deprecated Prefer modelRoute */
  litellmParams?: Record<string, unknown> | null;
}

export type ModelEntry = ModelInfo;

export interface SpendLogsQueryParams {
  model?: string;
  user?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface SpendLogsFilters {
  model?: string;
  user?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export interface SpendTotals {
  request_count: number;
  total_tokens: number;
  total_cost: number;
  error_count: number;
  avg_latency_ms: number;
}

export interface PaginationMetadata {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface SpendLogsResponse {
  logs: ProxyRequestLog[];
  pagination: PaginationMetadata;
}

export type { SystemAgent } from "@lite-llm/agent-schemas";

export type {
  ProxyRequestLog,
  ProxyRequestLogListItem,
} from "./proxy-request-log";

export interface ModelEntryConfig {
  modelName: string;
  litellmParams: Record<string, unknown> | null;
}

export interface ModelDailySpendTrend {
  date: string;
  spend: number;
  total_tokens: number;
  request_count: number;
  granularity?: TimeGranularity;
}

export interface ModelDailyTokenTrend {
  date: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  granularity?: TimeGranularity;
}

export interface ModelHourlyUsage {
  hour: number;
  request_count: number;
  total_spend: number;
  total_tokens: number;
}

export interface ModelDailyLatencyTrend {
  date: string;
  avg_latency_ms: number;
  p50_latency_ms: number;
  p95_latency_ms: number;
  p99_latency_ms: number;
  granularity?: TimeGranularity;
}

export interface ModelErrorBreakdown {
  error_type: string;
  count: number;
  last_occurred: string;
}

export interface ModelDailyErrorTrend {
  date: string;
  error_count: number;
  distinct_models?: string[];
  granularity?: TimeGranularity;
}

export interface ModelTopUser {
  user: string | null;
  total_spend: number;
  total_tokens: number;
  request_count: number;
}

export interface ModelTopApiKey {
  api_key: string | null;
  total_spend: number;
  total_tokens: number;
  request_count: number;
  success_rate: number;
}

// Monitor types — used by anomaly detection system
export interface ModelErrorCountSince {
  model: string;
  error_count: number;
  distinct_models?: string[];
}

export interface NonSuccessCountByModel {
  model: string;
  non_success_count: number;
}

export interface ModelHealth {
  total_requests: number;
  success_count: number;
  error_count: number;
  distinct_models?: string[];
  avg_latency_ms: number | null;
  last_success_at: string | null;
  last_error_at: string | null;
  p95_latency_ms: number | null;
}

export interface StuckRequest {
  request_id: string;
  model: string | null;
  startTime: string | null;
}

export interface ModelCacheHitRate {
  cache_hits: number;
  total_requests: number;
  cache_hit_rate: number;
}

export interface ModelTTFTPercentiles {
  avg_ttft_ms: number;
  p50_ttft_ms: number;
  p95_ttft_ms: number;
  p99_ttft_ms: number;
  min_ttft_ms: number;
  max_ttft_ms: number;
}

export interface ModelStatusDistribution {
  status: string;
  count: number;
  percentage: number;
}

export interface ModelProviderBreakdown {
  provider: string;
  request_count: number;
  total_spend: number;
  avg_latency_ms: number;
}

// Credentials types
export interface LiteLLMCredential {
  credentialId: string;
  credentialName: string;
  credentialValues: Record<string, unknown> | null;
  credentialInfo: Record<string, unknown> | null;
  createdAt: string | null;
  createdBy: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
}
