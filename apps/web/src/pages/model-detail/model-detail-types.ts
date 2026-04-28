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
}

export interface ModelDailyTokenTrend {
  date: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ModelDailyLatencyTrend {
  date: string;
  avgLatencyMs: number;
  p50LatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
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
