// Dashboard Types for LiteLLM Statistics

export interface SpendByModel {
  model: string;
  total_spend: number;
}

export interface SpendLog {
  request_id: string;
  model: string;
  user: string;
  total_tokens: number;
  prompt_tokens: number;
  completion_tokens: number;
  spend: number;
  start_time: string;
  end_time: string;
  api_key: string;
  status: string;
}

export interface UserSpend {
  user: string;
  total_spend: number;
  total_tokens: number;
}

export interface KeySpend {
  key: string;
  total_spend: number;
  total_tokens: number;
}

export interface ModelDetail {
  model_name: string;
  input_cost_per_token: number;
  output_cost_per_token: number;
}

export interface ErrorLog {
  id: string;
  error_type: string;
  model: string;
  user: string;
  error_message: string;
  timestamp: string;
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
}
