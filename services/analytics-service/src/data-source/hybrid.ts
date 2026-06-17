import type {
  AnalyticsDataSource,
  ProxyRequestLog,
  SpendLogsFilters,
  SpendLogsResponse,
  SpendTotals,
} from "../types/index";

function mergeProxyLogsById(
  litellmLogs: ProxyRequestLog[],
  proxyLogs: ProxyRequestLog[],
): ProxyRequestLog[] {
  const merged = new Map<string, ProxyRequestLog>();

  for (const log of litellmLogs) {
    merged.set(log.id, log);
  }

  for (const log of proxyLogs) {
    merged.set(log.id, log);
  }

  return [...merged.values()].sort(
    (left, right) =>
      new Date(right.started_at).getTime() -
      new Date(left.started_at).getTime(),
  );
}

const TOKEN_TOLERANCE_PCT = 0.1;
const COST_TOLERANCE_PCT = 1;

function withinPercentTolerance(
  left: number,
  right: number,
  tolerancePct: number,
): boolean {
  if (left === right) {
    return true;
  }

  const baseline = Math.max(Math.abs(left), Math.abs(right), 1);
  const deltaPct = (Math.abs(left - right) / baseline) * 100;
  return deltaPct <= tolerancePct;
}

function withinTokenTolerance(left: number, right: number): boolean {
  if (left === right) {
    return true;
  }

  const tokenDelta = Math.abs(left - right);
  if (tokenDelta <= 1) {
    return true;
  }

  return withinPercentTolerance(left, right, TOKEN_TOLERANCE_PCT);
}

export interface CompareTotalsWindow {
  startDate: string;
  endDate: string;
  model?: string;
}

export interface CompareTotalsMetric<T> {
  litellm: T;
  proxy: T;
  within_tolerance: boolean;
}

export interface CompareTotalsResult {
  request_count: CompareTotalsMetric<number> & { merged: number };
  total_tokens: CompareTotalsMetric<number> & { delta_pct: number };
  total_cost: CompareTotalsMetric<number> & { delta_pct: number };
  error_count: CompareTotalsMetric<number>;
  avg_latency_ms: CompareTotalsMetric<number>;
}

export async function compareTotals(
  window: CompareTotalsWindow,
  litellm: AnalyticsDataSource,
  proxy: AnalyticsDataSource,
): Promise<CompareTotalsResult> {
  const filters: Pick<SpendLogsFilters, "model" | "startDate" | "endDate"> = {
    model: window.model,
    startDate: window.startDate,
    endDate: window.endDate,
  };

  const [litellmTotals, proxyTotals] = await Promise.all([
    litellm.getSpendTotals(filters),
    proxy.getSpendTotals(filters),
  ]);

  const mergedRequestCount = Math.max(
    litellmTotals.request_count,
    proxyTotals.request_count,
  );

  return {
    request_count: {
      litellm: litellmTotals.request_count,
      proxy: proxyTotals.request_count,
      merged: mergedRequestCount,
      within_tolerance:
        mergedRequestCount ===
        Math.max(litellmTotals.request_count, proxyTotals.request_count),
    },
    total_tokens: {
      litellm: litellmTotals.total_tokens,
      proxy: proxyTotals.total_tokens,
      delta_pct:
        litellmTotals.total_tokens === 0
          ? 0
          : (Math.abs(litellmTotals.total_tokens - proxyTotals.total_tokens) /
              Math.max(litellmTotals.total_tokens, 1)) *
            100,
      within_tolerance: withinTokenTolerance(
        litellmTotals.total_tokens,
        proxyTotals.total_tokens,
      ),
    },
    total_cost: {
      litellm: litellmTotals.total_cost,
      proxy: proxyTotals.total_cost,
      delta_pct:
        litellmTotals.total_cost === 0
          ? 0
          : (Math.abs(litellmTotals.total_cost - proxyTotals.total_cost) /
              Math.max(litellmTotals.total_cost, 1)) *
            100,
      within_tolerance: withinPercentTolerance(
        litellmTotals.total_cost,
        proxyTotals.total_cost,
        COST_TOLERANCE_PCT,
      ),
    },
    error_count: {
      litellm: litellmTotals.error_count,
      proxy: proxyTotals.error_count,
      within_tolerance: litellmTotals.error_count === proxyTotals.error_count,
    },
    avg_latency_ms: {
      litellm: litellmTotals.avg_latency_ms,
      proxy: proxyTotals.avg_latency_ms,
      within_tolerance:
        litellmTotals.avg_latency_ms === proxyTotals.avg_latency_ms,
    },
  };
}

export class HybridDataSource implements AnalyticsDataSource {
  constructor(
    private readonly litellm: AnalyticsDataSource,
    private readonly proxy: AnalyticsDataSource,
  ) {}

  compareTotals = (window: CompareTotalsWindow) =>
    compareTotals(window, this.litellm, this.proxy);

  getSpendTotals = (
    filters: Pick<SpendLogsFilters, "model" | "startDate" | "endDate">,
  ) => this.proxy.getSpendTotals(filters);

  getSpendLogs = async (
    filters: SpendLogsFilters,
  ): Promise<SpendLogsResponse> => {
    const [litellmResponse, proxyResponse] = await Promise.all([
      this.litellm.getSpendLogs({ ...filters, limit: 0, offset: 0 }),
      this.proxy.getSpendLogs({ ...filters, limit: 0, offset: 0 }),
    ]);

    const merged = mergeProxyLogsById(litellmResponse.logs, proxyResponse.logs);
    const limit = filters.limit ?? 50;
    const offset = filters.offset ?? 0;
    const logs = merged.slice(offset, offset + limit);
    const total = merged.length;

    return {
      logs,
      pagination: {
        total,
        page: Math.floor(offset / limit) + 1,
        page_size: limit,
        total_pages: total === 0 ? 0 : Math.ceil(total / limit),
      },
    };
  };

  getSpendLogsCount = async (filters: SpendLogsFilters): Promise<number> => {
    const response = await this.getSpendLogs({
      ...filters,
      limit: 0,
      offset: 0,
    });
    return response.pagination.total;
  };

  getSpendLogDetail = async (requestId: string): Promise<ProxyRequestLog> => {
    try {
      return await this.proxy.getSpendLogDetail(requestId);
    } catch {
      return this.litellm.getSpendLogDetail(requestId);
    }
  };

  getMetricsSummary = (
    ...args: Parameters<AnalyticsDataSource["getMetricsSummary"]>
  ) => this.proxy.getMetricsSummary(...args);
  getDailySpendTrend = (
    ...args: Parameters<AnalyticsDataSource["getDailySpendTrend"]>
  ) => this.proxy.getDailySpendTrend(...args);
  getHourlySpendTrend = (
    ...args: Parameters<AnalyticsDataSource["getHourlySpendTrend"]>
  ) => this.proxy.getHourlySpendTrend(...args);
  getSpendByModel = (
    ...args: Parameters<AnalyticsDataSource["getSpendByModel"]>
  ) => this.proxy.getSpendByModel(...args);
  getSpendByUser = (
    ...args: Parameters<AnalyticsDataSource["getSpendByUser"]>
  ) => this.litellm.getSpendByUser(...args);
  getSpendByKey = (...args: Parameters<AnalyticsDataSource["getSpendByKey"]>) =>
    this.litellm.getSpendByKey(...args);
  getTokenDistribution = (
    ...args: Parameters<AnalyticsDataSource["getTokenDistribution"]>
  ) => this.proxy.getTokenDistribution(...args);
  getPerformanceMetrics = (
    ...args: Parameters<AnalyticsDataSource["getPerformanceMetrics"]>
  ) => this.proxy.getPerformanceMetrics(...args);
  getHourlyUsagePatterns = (
    ...args: Parameters<AnalyticsDataSource["getHourlyUsagePatterns"]>
  ) => this.proxy.getHourlyUsagePatterns(...args);
  getApiKeyStats = (
    ...args: Parameters<AnalyticsDataSource["getApiKeyStats"]>
  ) => this.litellm.getApiKeyStats(...args);
  getCostEfficiency = (
    ...args: Parameters<AnalyticsDataSource["getCostEfficiency"]>
  ) => this.proxy.getCostEfficiency(...args);
  getModelDistribution = (
    ...args: Parameters<AnalyticsDataSource["getModelDistribution"]>
  ) => this.proxy.getModelDistribution(...args);
  getDailyTokenTrend = (
    ...args: Parameters<AnalyticsDataSource["getDailyTokenTrend"]>
  ) => this.proxy.getDailyTokenTrend(...args);
  getModelStatistics = (
    ...args: Parameters<AnalyticsDataSource["getModelStatistics"]>
  ) => this.proxy.getModelStatistics(...args);
  getDailySpendTrendByModel = (
    ...args: Parameters<AnalyticsDataSource["getDailySpendTrendByModel"]>
  ) => this.proxy.getDailySpendTrendByModel(...args);
  getDailyTokenTrendByModel = (
    ...args: Parameters<AnalyticsDataSource["getDailyTokenTrendByModel"]>
  ) => this.proxy.getDailyTokenTrendByModel(...args);
  getHourlyUsageByModel = (
    ...args: Parameters<AnalyticsDataSource["getHourlyUsageByModel"]>
  ) => this.proxy.getHourlyUsageByModel(...args);
  getDailyLatencyTrendByModel = (
    ...args: Parameters<AnalyticsDataSource["getDailyLatencyTrendByModel"]>
  ) => this.proxy.getDailyLatencyTrendByModel(...args);
  getErrorBreakdownByModel = (
    ...args: Parameters<AnalyticsDataSource["getErrorBreakdownByModel"]>
  ) => this.proxy.getErrorBreakdownByModel(...args);
  getDailyErrorTrendByModel = (
    ...args: Parameters<AnalyticsDataSource["getDailyErrorTrendByModel"]>
  ) => this.proxy.getDailyErrorTrendByModel(...args);
  getModels = () => this.proxy.getModels();
  getModelDetails = () => this.proxy.getModelDetails();
  getErrorLogs = (...args: Parameters<AnalyticsDataSource["getErrorLogs"]>) =>
    this.proxy.getErrorLogs(...args);
  createModel = (...args: Parameters<AnalyticsDataSource["createModel"]>) =>
    this.proxy.createModel(...args);
  updateModel = (...args: Parameters<AnalyticsDataSource["updateModel"]>) =>
    this.proxy.updateModel(...args);
  deleteModel = (...args: Parameters<AnalyticsDataSource["deleteModel"]>) =>
    this.proxy.deleteModel(...args);
  mergeModels = (...args: Parameters<AnalyticsDataSource["mergeModels"]>) =>
    this.proxy.mergeModels(...args);
  deleteModelLogs = (
    ...args: Parameters<AnalyticsDataSource["deleteModelLogs"]>
  ) => this.proxy.deleteModelLogs(...args);
  getAgentRoutingConfig = () => this.proxy.getAgentRoutingConfig();
  updateAgentRoutingConfig = (
    ...args: Parameters<AnalyticsDataSource["updateAgentRoutingConfig"]>
  ) => this.proxy.updateAgentRoutingConfig(...args);
  getTopUsersByModel = (
    ...args: Parameters<AnalyticsDataSource["getTopUsersByModel"]>
  ) => this.litellm.getTopUsersByModel(...args);
  getTopApiKeysByModel = (
    ...args: Parameters<AnalyticsDataSource["getTopApiKeysByModel"]>
  ) => this.litellm.getTopApiKeysByModel(...args);
  getErrorsSince = (
    ...args: Parameters<AnalyticsDataSource["getErrorsSince"]>
  ) => this.proxy.getErrorsSince(...args);
  getErrorCountByModelSince = (
    ...args: Parameters<AnalyticsDataSource["getErrorCountByModelSince"]>
  ) => this.proxy.getErrorCountByModelSince(...args);
  getNonSuccessCountByModelSince = (
    ...args: Parameters<AnalyticsDataSource["getNonSuccessCountByModelSince"]>
  ) => this.proxy.getNonSuccessCountByModelSince(...args);
  getModelHealthSince = (
    ...args: Parameters<AnalyticsDataSource["getModelHealthSince"]>
  ) => this.proxy.getModelHealthSince(...args);
  getStuckRequests = (
    ...args: Parameters<AnalyticsDataSource["getStuckRequests"]>
  ) => this.proxy.getStuckRequests(...args);
  getCacheHitRateByModel = (
    ...args: Parameters<AnalyticsDataSource["getCacheHitRateByModel"]>
  ) => this.proxy.getCacheHitRateByModel(...args);
  getTTFTPercentilesByModel = (
    ...args: Parameters<AnalyticsDataSource["getTTFTPercentilesByModel"]>
  ) => this.proxy.getTTFTPercentilesByModel(...args);
  getStatusDistributionByModel = (
    ...args: Parameters<AnalyticsDataSource["getStatusDistributionByModel"]>
  ) => this.proxy.getStatusDistributionByModel(...args);
  getProviderBreakdownByModel = (
    ...args: Parameters<AnalyticsDataSource["getProviderBreakdownByModel"]>
  ) => this.proxy.getProviderBreakdownByModel(...args);
  getCredentials = () => this.proxy.getCredentials();
  getDefaultCredential = () => this.proxy.getDefaultCredential();
  getHealthCheckPrompt = () => this.proxy.getHealthCheckPrompt();
  setDefaultCredential = (
    ...args: Parameters<AnalyticsDataSource["setDefaultCredential"]>
  ) => this.proxy.setDefaultCredential(...args);
}
