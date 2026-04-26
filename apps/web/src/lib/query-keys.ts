export const queryKeys = {
  serverMode: ["server-mode"] as const,
  models: ["models"] as const,
  modelStatistics: ["model-statistics"] as const,
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
};
