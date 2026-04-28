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
  agentRoutingData: ["agent-routing-data"] as const,
  agentRoutingAliases: ["agent-routing-aliases"] as const,
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
};
