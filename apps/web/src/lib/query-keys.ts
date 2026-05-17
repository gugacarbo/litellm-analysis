export const queryKeys = {
  models: ["models"] as const,
  modelStatistics: (days: number) => ["model-statistics", days] as const,
  errorLogs: (limit: number) => ["error-logs", limit] as const,
  dashboardMetrics: (days: number) => ["dashboard", "metrics", days] as const,
  dashboardSpendByModel: (days: number) =>
    ["dashboard", "spend-by-model", days] as const,
  dashboardSpendByUser: (days: number) =>
    ["dashboard", "spend-by-user", days] as const,
  dashboardDailySpendTrend: (days: number) =>
    ["dashboard", "daily-spend-trend", days] as const,
  dashboardTokenDistribution: (days: number) =>
    ["dashboard", "token-distribution", days] as const,
  dashboardPerformance: (days: number) =>
    ["dashboard", "performance", days] as const,
  dashboardHourlyPatterns: (days: number) =>
    ["dashboard", "hourly-patterns", days] as const,
  dashboardApiKeyStats: (days: number) =>
    ["dashboard", "api-key-stats", days] as const,
  dashboardCostEfficiency: (days: number) =>
    ["dashboard", "cost-efficiency", days] as const,
  dashboardModelDistribution: (days: number) =>
    ["dashboard", "model-distribution", days] as const,
  dashboardDailyTokenTrend: (days: number) =>
    ["dashboard", "daily-token-trend", days] as const,
  dashboardModelStatistics: (days: number) =>
    ["dashboard", "model-statistics", days] as const,
  spendLogs: (params: {
    page: number;
    pageSize: number;
    model?: string;
    user?: string;
    startDate?: string;
    endDate?: string;
  }) =>
    [
      "spend-logs",
      params.page,
      params.pageSize,
      params.model ?? "",
      params.user ?? "",
      params.startDate ?? "",
      params.endDate ?? "",
    ] as const,
  spendLogDetail: (requestId: string) => ["spend-log", requestId] as const,
  modelDetailDailySpend: (model: string, days: number) =>
    ["model-detail", "daily-spend", model, days] as const,
  modelDetailDailyTokens: (model: string, days: number) =>
    ["model-detail", "daily-tokens", model, days] as const,
  modelDetailHourlyUsage: (model: string, days: number) =>
    ["model-detail", "hourly-usage", model, days] as const,
  modelDetailLatencyTrend: (model: string, days: number) =>
    ["model-detail", "latency-trend", model, days] as const,
  modelDetailErrorBreakdown: (model: string, days: number) =>
    ["model-detail", "error-breakdown", model, days] as const,
  modelDetailDailyErrors: (model: string, days: number) =>
    ["model-detail", "daily-errors", model, days] as const,
  modelDetailTopUsers: (model: string, days: number) =>
    ["model-detail", "top-users", model, days] as const,
  modelDetailTopApiKeys: (model: string, days: number) =>
    ["model-detail", "top-api-keys", model, days] as const,
  modelDetailCacheHitRate: (model: string, days: number) =>
    ["model-detail", "cache-hit-rate", model, days] as const,
  modelDetailTTFT: (model: string, days: number) =>
    ["model-detail", "ttft", model, days] as const,
  modelDetailStatusDistribution: (model: string, days: number) =>
    ["model-detail", "status-distribution", model, days] as const,
  modelDetailProviderBreakdown: (model: string, days: number) =>
    ["model-detail", "provider-breakdown", model, days] as const,
  healthCheckResults: (params: {
    limit: number;
    offset: number;
    model?: string;
    since?: string;
  }) =>
    [
      "health-check",
      "results",
      params.limit,
      params.offset,
      params.model ?? "",
      params.since ?? "",
    ] as const,
  healthCheckLatest: ["health-check", "latest"] as const,
  healthCheckSummary: ["health-check", "summary"] as const,
  agentCatalog: {
    all: ["agent-catalog"] as const,
    detail: (id: string) => ["agent-catalog", id] as const,
  },
  categoryCatalog: {
    all: ["category-catalog"] as const,
    detail: (key: string) => ["category-catalog", key] as const,
  },
  pluginRouting: {
    all: ["plugin-routing"] as const,
    plugins: ["plugin-routing", "plugins"] as const,
    pluginConfig: (pluginId: string) =>
      ["plugin-routing", "config", pluginId] as const,
  },
};
