export interface ModelDetailSummary {
  model: string;
  totalSpend: number;
  totalRequests: number;
  totalTokens: number;
  promptTokens: number;
  completionTokens: number;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  successRate: number;
  errorCount: number;
  firstSeen: string;
  lastSeen: string;
  rank: number;
  percentOfTotal: number;
  uniqueUsers: number;
  uniqueApiKeys: number;
  costPer1kTokens: number;
}

export interface ModelDailySpendTrend {
  date: string;
  spend: number;
  totalTokens: number;
  requestCount: number;
  granularity?: string;
}

export interface ModelDailyTokenTrend {
  date: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  granularity?: string;
}

export interface ModelDailyLatencyTrend {
  date: string;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  granularity?: string;
}

export interface ModelHourlyUsage {
  hour: number;
  requestCount: number;
  totalSpend: number;
  totalTokens: number;
}

export interface ModelErrorBreakdown {
  errorType: string;
  count: number;
  lastOccurred: string;
}

export interface ModelDailyErrorTrend {
  date: string;
  errorCount: number;
  granularity?: string;
}

export interface ModelUser {
  user: string;
  totalSpend: number;
  totalTokens: number;
  requestCount: number;
}

export interface ModelApiKey {
  apiKey: string;
  totalSpend: number;
  totalTokens: number;
  requestCount: number;
  successRate: number;
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
