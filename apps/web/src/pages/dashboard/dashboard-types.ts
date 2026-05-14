export type DashboardDateRangeKey =
  | "15m"
  | "1h"
  | "5h"
  | "12h"
  | "24h"
  | "7d"
  | "14d"
  | "30d"
  | "lifetime"
  | "custom";
export type DateRangeGroup = "hours" | "days" | "custom";

export type TimeRangeValue = {
  preset?: DashboardDateRangeKey;
  from?: Date;
  to?: Date;
};

export type DashboardDateRangeOption = {
  key: DashboardDateRangeKey;
  label: string;
  days: number;
  description: string;
};

export type DashboardMetrics = {
  totalSpend: number;
  totalTokens: number;
  activeModels: number;
  errorCount: number;
};

/**
 * Daily trend item with automatic granularity support.
 * For hourly ranges (< 1 day): date is formatted as "YYYY-MM-DD HH24:MI"
 * For daily ranges (>= 1 day): date is formatted as "YYYY-MM-DD"
 */
export type DailyTrendItem = {
  date: string;
  spend: number;
  granularity?: "hour" | "day";
};

export type TokenDistributionItem = {
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  avg_tokens_per_request: number;
  input_output_ratio: number;
};

export type PerformanceMetrics = {
  total_requests: number;
  avg_duration_ms: number;
  success_rate: number;
};

export type HourlyPatternItem = {
  hour: number;
  request_count: number;
  total_spend: number;
  total_tokens: number;
};

export type ApiKeyStatItem = {
  key: string;
  request_count: number;
  total_spend: number;
  total_tokens: number;
  avg_tokens_per_request: number;
  success_rate: number;
  last_used: string;
};

export type CostEfficiencyItem = {
  model: string;
  total_spend: number;
  total_tokens: number;
  cost_per_1k_tokens: number;
  request_count: number;
};

export type ModelDistributionItem = {
  model: string;
  request_count: number;
  percentage: number;
};

export type DailyTokenTrendItem = {
  date: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  request_count: number;
  granularity?: "hour" | "day";
};

export type SpendByUserItem = {
  user: string;
  total_spend: number;
  total_tokens: number;
  request_count: number;
};

export type DashboardInsight = {
  title: string;
  value: string;
  detail: string;
  tone: "neutral" | "positive" | "warning";
};
