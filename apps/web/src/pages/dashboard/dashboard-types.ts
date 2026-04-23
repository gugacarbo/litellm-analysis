export type DashboardDateRangeKey = 'today' | '7d' | '30d' | '60d' | 'all';

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

export type DailyTrendItem = {
  date: string;
  spend: number;
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
  tone: 'neutral' | 'positive' | 'warning';
};
