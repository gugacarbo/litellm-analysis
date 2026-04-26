// Analytics Data Source Interface
export interface AnalyticsDataSource {
  capabilities: AnalyticsCapabilities;

  getMetricsSummary(days?: number): Promise<MetricsSummary>;
  getDailySpendTrend(days?: number): Promise<DailySpendTrend[]>;
  getSpendByModel(days?: number): Promise<SpendByModel[]>;
  getSpendByUser(days?: number): Promise<SpendByUser[]>;
  getSpendByKey(days?: number): Promise<SpendByKey[]>;
  getSpendLogs(filters: SpendLogsFilters): Promise<SpendLogsResponse>;
  getSpendLogsCount(filters: SpendLogsFilters): Promise<number>;
  getTokenDistribution(days?: number): Promise<TokenDistribution[]>;
  getPerformanceMetrics(days?: number): Promise<PerformanceMetrics>;
  getHourlyUsagePatterns(days?: number): Promise<HourlyUsagePattern[]>;
  getApiKeyStats(days?: number): Promise<ApiKeyStats[]>;
  getCostEfficiency(days?: number): Promise<CostEfficiency[]>;
  getModelDistribution(days?: number): Promise<ModelRequestDistribution[]>;
  getDailyTokenTrend(days?: number): Promise<DailyTokenTrend[]>;
  getModelStatistics(days?: number): Promise<ModelStatistics[]>;
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
  getAgentConfigs(): Promise<Record<string, unknown>>;
  getCategoryConfigs(): Promise<Record<string, unknown>>;
  updateAgentConfig(
    agentKey: string,
    config: Record<string, unknown>,
  ): Promise<void>;
  updateCategoryConfig(
    categoryKey: string,
    config: Record<string, unknown>,
  ): Promise<void>;
  deleteAgentConfig(agentKey: string): Promise<void>;
  deleteCategoryConfig(categoryKey: string): Promise<void>;
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
}

export interface ErrorLogEntry {
  id: string;
  error_type: string | null;
  model: string | null;
  user: string | null;
  error_message: string | null;
  timestamp: string;
  status_code: number | null;
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
}

export type MetricsSummary = MetricsSummaryResult;

export interface DailySpendTrend {
  date: string;
  spend: number;
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

export interface DailyTokenTrend {
  date: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
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
  avg_input_cost: number | null;
  avg_output_cost: number | null;
  p50_latency_ms: number | null;
  p95_latency_ms: number | null;
  p99_latency_ms: number | null;
  first_seen: string | null;
  last_seen: string | null;
  unique_users: number;
  unique_api_keys: number;
}

export interface ModelInfo {
  modelName: string;
  litellmParams: Record<string, unknown> | null;
}

export type ModelEntry = ModelInfo;

export interface ModelQueryParams {
  name?: string;
}

export interface SpendLogsQueryParams {
  model?: string;
  user?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export type SpendLogsFilters = SpendLogsQueryParams;

export interface PaginationMetadata {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface SpendLogsResponse {
  logs: SpendLogEntry[];
  pagination: PaginationMetadata;
}

export interface FilterOptions {
  models: string[];
  users: string[];
  date_range: {
    min: string;
    max: string;
  };
}

export interface AnalyticsCapabilities {
  spendByModel: boolean;
  spendByUser: boolean;
  spendByKey: boolean;
  spendLogs: boolean;
  metricsSummary: boolean;
  dailySpendTrend: boolean;
  tokenDistribution: boolean;
  performanceMetrics: boolean;
  hourlyUsagePatterns: boolean;
  apiKeyStats: boolean;
  costEfficiency: boolean;
  modelDistribution: boolean;
  dailyTokenTrend: boolean;
  modelStatistics: boolean;
  models: boolean;
  errorLogs: boolean;
  detailedLatency: boolean;
  logMerge: boolean;
  filterOptions: boolean;
  createModel: boolean;
  updateModel: boolean;
  deleteModel: boolean;
  mergeModels: boolean;
  deleteModelLogs: boolean;
  agentRouting: boolean;
  agentConfigFile: boolean;
}

export type DataSourceMode = "database" | "api-only" | "limited";

export interface DataSourceConfig {
  mode?: DataSourceMode;
  database?: DatabaseConfig;
  api?: ApiConfig;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
}

export interface ApiConfig {
  url: string;
  api_key: string;
}

// Re-export agent config types from shared (single source of truth)
export type {
  AgentConfig,
  AgentConfigFile,
  CategoryConfig,
} from "@litellm/shared";

export interface ModelEntryConfig {
  modelName: string;
  litellmParams: Record<string, unknown> | null;
}
