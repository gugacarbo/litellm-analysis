import type {
  AnalyticsCapabilities,
  AnalyticsDataSource,
  ApiKeyStats,
  CostEfficiency,
  DailySpendTrend,
  DailyTokenTrend,
  ErrorLogEntry,
  HourlyUsagePattern,
  MetricsSummary,
  ModelDetail,
  ModelEntry,
  ModelRequestDistribution,
  ModelStatistics,
  PerformanceMetrics,
  SpendByKey,
  SpendByModel,
  SpendByUser,
  SpendLogsFilters,
  SpendLogsResponse,
  TokenDistribution,
} from './types';

const API_CAPABILITIES: AnalyticsCapabilities = {
  spendByModel: true,
  spendByUser: true,
  spendByKey: true,
  spendLogs: true,
  metricsSummary: true,
  dailySpendTrend: true,
  tokenDistribution: true,
  performanceMetrics: true,
  hourlyUsagePatterns: true,
  apiKeyStats: true,
  costEfficiency: true,
  modelDistribution: true,
  dailyTokenTrend: true,
  modelStatistics: true,
  models: true,
  errorLogs: false,
  detailedLatency: false,
  logMerge: false,
  filterOptions: false,
  createModel: false,
  updateModel: false,
  deleteModel: false,
  mergeModels: false,
  deleteModelLogs: false,
  agentRouting: false,
  agentConfigFile: false,
};

const DEFAULT_DASHBOARD_DAYS = 30;
const DEFAULT_HOURLY_DAYS = 7;
const MAX_LOGS_FETCH = 5000;

function normalizeDays(days: number | undefined, fallback: number): number {
  if (typeof days !== 'number' || Number.isNaN(days) || days < 0) {
    return fallback;
  }
  return days;
}

function getWindowStart(days: number): Date | null {
  if (days <= 0) {
    return null;
  }

  const now = new Date();

  if (days === 1) {
    now.setHours(0, 0, 0, 0);
    return now;
  }

  now.setDate(now.getDate() - days);
  return now;
}

function getDayKey(timestamp: string): string {
  return timestamp.split('T')[0];
}

export class ApiDataSource implements AnalyticsDataSource {
  private apiUrl: string;
  private apiKey: string;
  capabilities = API_CAPABILITIES;

  constructor(apiUrl: string, apiKey: string) {
    this.apiUrl = apiUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
  }

  private async fetchWithAuth<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.apiUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`,
      );
    }

    return response.json() as Promise<T>;
  }

  private isWithinWindow(startTime: string | undefined, days: number): boolean {
    if (!startTime) {
      return false;
    }

    const timestamp = new Date(startTime);
    if (Number.isNaN(timestamp.getTime())) {
      return false;
    }

    const windowStart = getWindowStart(days);
    if (!windowStart) {
      return true;
    }

    return timestamp >= windowStart;
  }

  private async getFilteredLogs(days: number): Promise<SpendLogResponse[]> {
    const logs = await this.fetchWithAuth<SpendLogResponse[]>(
      `/spend/logs?limit=${MAX_LOGS_FETCH}`,
    );

    if (!logs || !Array.isArray(logs)) {
      return [];
    }

    return logs.filter((log) => this.isWithinWindow(log.startTime, days));
  }

  async getMetricsSummary(
    days = DEFAULT_DASHBOARD_DAYS,
  ): Promise<MetricsSummary> {
    const normalizedDays = normalizeDays(days, DEFAULT_DASHBOARD_DAYS);
    const logs = await this.getFilteredLogs(normalizedDays);

    const modelSet = new Set<string>();
    let totalSpend = 0;
    let totalTokens = 0;

    logs.forEach((log) => {
      modelSet.add(log.model);
      totalSpend += Number(log.spend || log.total_spend || 0);
      totalTokens += Number(log.total_tokens || 0);
    });

    return {
      total_spend: totalSpend,
      total_tokens: totalTokens,
      active_models: modelSet.size,
      error_count: 0,
    };
  }

  async getDailySpendTrend(
    days = DEFAULT_DASHBOARD_DAYS,
  ): Promise<DailySpendTrend[]> {
    const normalizedDays = normalizeDays(days, DEFAULT_DASHBOARD_DAYS);
    const logs = await this.getFilteredLogs(normalizedDays);

    const dailySpend = new Map<string, number>();

    logs
      .filter((log): log is SpendLogResponse & { startTime: string } =>
        Boolean(log.startTime),
      )
      .forEach((log) => {
        const date = getDayKey(log.startTime);
        const current = dailySpend.get(date) || 0;
        dailySpend.set(
          date,
          current + Number(log.spend || log.total_spend || 0),
        );
      });

    return Array.from(dailySpend.entries())
      .map(([date, spend]) => ({ date, spend }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async getSpendByModel(
    days = DEFAULT_DASHBOARD_DAYS,
  ): Promise<SpendByModel[]> {
    const normalizedDays = normalizeDays(days, DEFAULT_DASHBOARD_DAYS);
    const logs = await this.getFilteredLogs(normalizedDays);

    const modelSpend = new Map<string, number>();
    logs.forEach((log) => {
      const current = modelSpend.get(log.model) || 0;
      modelSpend.set(
        log.model,
        current + Number(log.spend || log.total_spend || 0),
      );
    });

    return Array.from(modelSpend.entries())
      .map(([model, total_spend]) => ({ model, total_spend }))
      .sort((a, b) => b.total_spend - a.total_spend)
      .slice(0, 20);
  }

  async getSpendByUser(days = DEFAULT_DASHBOARD_DAYS): Promise<SpendByUser[]> {
    const normalizedDays = normalizeDays(days, DEFAULT_DASHBOARD_DAYS);
    const logs = await this.getFilteredLogs(normalizedDays);

    const users = new Map<
      string,
      { total_spend: number; total_tokens: number; request_count: number }
    >();

    logs.forEach((log) => {
      const user = log.user ?? 'Anonymous';
      const existing = users.get(user) || {
        total_spend: 0,
        total_tokens: 0,
        request_count: 0,
      };

      existing.total_spend += Number(log.spend || log.total_spend || 0);
      existing.total_tokens += Number(log.total_tokens || 0);
      existing.request_count += 1;

      users.set(user, existing);
    });

    return Array.from(users.entries())
      .map(([user, stats]) => ({
        user,
        total_spend: stats.total_spend,
        total_tokens: stats.total_tokens,
        request_count: stats.request_count,
      }))
      .sort((a, b) => b.total_spend - a.total_spend)
      .slice(0, 20);
  }

  async getSpendByKey(days = DEFAULT_DASHBOARD_DAYS): Promise<SpendByKey[]> {
    const normalizedDays = normalizeDays(days, DEFAULT_DASHBOARD_DAYS);
    const logs = await this.getFilteredLogs(normalizedDays);

    const keys = new Map<
      string,
      { total_spend: number; total_tokens: number }
    >();

    logs.forEach((log) => {
      const key = log.api_key ?? 'Unknown';
      const existing = keys.get(key) || {
        total_spend: 0,
        total_tokens: 0,
      };

      existing.total_spend += Number(log.spend || log.total_spend || 0);
      existing.total_tokens += Number(log.total_tokens || 0);

      keys.set(key, existing);
    });

    return Array.from(keys.entries())
      .map(([key, stats]) => ({
        key,
        total_spend: stats.total_spend,
        total_tokens: stats.total_tokens,
      }))
      .sort((a, b) => b.total_spend - a.total_spend)
      .slice(0, 20);
  }

  async getSpendLogs(filters: SpendLogsFilters): Promise<SpendLogsResponse> {
    const params = new URLSearchParams();
    if (filters.model) params.append('model', filters.model);
    if (filters.user) params.append('user', filters.user);
    if (filters.startDate) params.append('start_date', filters.startDate);
    if (filters.endDate) params.append('end_date', filters.endDate);
    if (filters.limit) params.append('limit', String(filters.limit));
    if (filters.offset) params.append('offset', String(filters.offset));

    const logs = await this.fetchWithAuth<SpendLogResponse[]>(
      `/spend/logs?${params.toString()}`,
    );

    if (!logs || !Array.isArray(logs)) {
      return {
        logs: [],
        pagination: {
          total: 0,
          page: 1,
          page_size: filters.limit || 100,
          total_pages: 0,
        },
      };
    }

    return {
      logs: logs.map((log) => ({
        request_id: log.request_id,
        model: log.model,
        user: log.user || null,
        total_tokens:
          log.total_tokens !== null ? Number(log.total_tokens) : null,
        prompt_tokens:
          log.prompt_tokens !== null ? Number(log.prompt_tokens) : null,
        completion_tokens:
          log.completion_tokens !== null ? Number(log.completion_tokens) : null,
        spend: Number(log.spend || log.total_spend || 0),
        start_time: log.startTime ? new Date(log.startTime).toISOString() : '',
        end_time: log.endTime ? new Date(log.endTime).toISOString() : null,
        api_key: log.api_key || null,
        status: log.status || 'unknown',
      })),
      pagination: {
        total: 0,
        page: 1,
        page_size: filters.limit || 100,
        total_pages: 0,
      },
    };
  }

  async getSpendLogsCount(_filters: SpendLogsFilters): Promise<number> {
    return 0;
  }

  async getTokenDistribution(
    days = DEFAULT_DASHBOARD_DAYS,
  ): Promise<TokenDistribution[]> {
    const normalizedDays = normalizeDays(days, DEFAULT_DASHBOARD_DAYS);
    const logs = await this.getFilteredLogs(normalizedDays);

    const modelData = new Map<
      string,
      { prompt: number; completion: number; count: number }
    >();

    logs.forEach((log) => {
      const model = log.model;
      if (!modelData.has(model)) {
        modelData.set(model, { prompt: 0, completion: 0, count: 0 });
      }
      const data = modelData.get(model);
      if (data) {
        data.prompt += Number(log.prompt_tokens || 0);
        data.completion += Number(log.completion_tokens || 0);
        data.count += 1;
      }
    });

    return Array.from(modelData.entries())
      .map(([model, data]) => {
        const total = data.prompt + data.completion;
        return {
          model,
          prompt_tokens: data.prompt,
          completion_tokens: data.completion,
          avg_tokens_per_request: data.count > 0 ? total / data.count : 0,
          input_output_ratio:
            data.completion > 0 ? data.prompt / data.completion : 0,
        };
      })
      .sort(
        (a, b) =>
          b.prompt_tokens +
          b.completion_tokens -
          (a.prompt_tokens + a.completion_tokens),
      )
      .slice(0, 20);
  }

  async getPerformanceMetrics(
    days = DEFAULT_DASHBOARD_DAYS,
  ): Promise<PerformanceMetrics> {
    const normalizedDays = normalizeDays(days, DEFAULT_DASHBOARD_DAYS);
    const logs = await this.getFilteredLogs(normalizedDays);

    if (logs.length === 0) {
      return {
        total_requests: 0,
        avg_duration_ms: 0,
        success_rate: 0,
      };
    }

    const total_requests = logs.length;
    const successful = logs.filter((log) => log.status === 'success').length;

    let totalDuration = 0;
    let durationCount = 0;
    logs.forEach((log) => {
      if (log.startTime && log.endTime) {
        const start = new Date(log.startTime).getTime();
        const end = new Date(log.endTime).getTime();
        if (end > start) {
          totalDuration += end - start;
          durationCount++;
        }
      }
    });

    return {
      total_requests,
      avg_duration_ms: durationCount > 0 ? totalDuration / durationCount : 0,
      success_rate:
        total_requests > 0 ? (successful / total_requests) * 100 : 0,
    };
  }

  async getHourlyUsagePatterns(
    days = DEFAULT_HOURLY_DAYS,
  ): Promise<HourlyUsagePattern[]> {
    const normalizedDays = normalizeDays(days, DEFAULT_HOURLY_DAYS);
    const logs = await this.getFilteredLogs(normalizedDays);

    const hourlyData = new Map<
      number,
      { request_count: number; total_spend: number; total_tokens: number }
    >();

    for (let hour = 0; hour < 24; hour++) {
      hourlyData.set(hour, {
        request_count: 0,
        total_spend: 0,
        total_tokens: 0,
      });
    }

    logs.forEach((log) => {
      if (!log.startTime) {
        return;
      }

      const hour = new Date(log.startTime).getHours();
      const data = hourlyData.get(hour);
      if (!data) {
        return;
      }

      data.request_count += 1;
      data.total_spend += Number(log.spend || log.total_spend || 0);
      data.total_tokens += Number(log.total_tokens || 0);
    });

    return Array.from(hourlyData.entries()).map(([hour, data]) => ({
      hour,
      request_count: data.request_count,
      total_spend: data.total_spend,
      total_tokens: data.total_tokens,
    }));
  }

  async getApiKeyStats(days = DEFAULT_DASHBOARD_DAYS): Promise<ApiKeyStats[]> {
    const normalizedDays = normalizeDays(days, DEFAULT_DASHBOARD_DAYS);
    const logs = await this.getFilteredLogs(normalizedDays);

    const keyStats = new Map<
      string,
      {
        request_count: number;
        total_spend: number;
        total_tokens: number;
        successful: number;
        last_used: string;
      }
    >();

    logs.forEach((log) => {
      const key = log.api_key ?? 'Unknown';
      const existing = keyStats.get(key) || {
        request_count: 0,
        total_spend: 0,
        total_tokens: 0,
        successful: 0,
        last_used: '',
      };

      existing.request_count += 1;
      existing.total_spend += Number(log.spend || log.total_spend || 0);
      existing.total_tokens += Number(log.total_tokens || 0);
      existing.successful += log.status === 'success' ? 1 : 0;

      if (log.startTime && log.startTime > existing.last_used) {
        existing.last_used = log.startTime;
      }

      keyStats.set(key, existing);
    });

    return Array.from(keyStats.entries())
      .map(([key, stats]) => ({
        key,
        request_count: stats.request_count,
        total_spend: stats.total_spend,
        total_tokens: stats.total_tokens,
        avg_tokens_per_request:
          stats.request_count > 0
            ? stats.total_tokens / stats.request_count
            : 0,
        success_rate:
          stats.request_count > 0
            ? (stats.successful / stats.request_count) * 100
            : 0,
        last_used: stats.last_used
          ? new Date(stats.last_used).toISOString()
          : '',
      }))
      .sort((a, b) => b.total_spend - a.total_spend)
      .slice(0, 20);
  }

  async getCostEfficiency(
    days = DEFAULT_DASHBOARD_DAYS,
  ): Promise<CostEfficiency[]> {
    const normalizedDays = normalizeDays(days, DEFAULT_DASHBOARD_DAYS);
    const logs = await this.getFilteredLogs(normalizedDays);

    const modelData = new Map<
      string,
      { spend: number; tokens: number; request_count: number }
    >();

    logs.forEach((log) => {
      const model = log.model;
      if (!modelData.has(model)) {
        modelData.set(model, { spend: 0, tokens: 0, request_count: 0 });
      }
      const data = modelData.get(model);
      if (data) {
        data.spend += Number(log.spend || log.total_spend || 0);
        data.tokens += Number(log.total_tokens || 0);
        data.request_count += 1;
      }
    });

    return Array.from(modelData.entries())
      .map(([model, data]) => ({
        model,
        total_spend: data.spend,
        total_tokens: data.tokens,
        cost_per_1k_tokens:
          data.tokens > 0 ? (data.spend / data.tokens) * 1000 : 0,
        request_count: data.request_count,
      }))
      .sort((a, b) => b.total_spend - a.total_spend)
      .slice(0, 20);
  }

  async getModelDistribution(
    days = DEFAULT_DASHBOARD_DAYS,
  ): Promise<ModelRequestDistribution[]> {
    const normalizedDays = normalizeDays(days, DEFAULT_DASHBOARD_DAYS);
    const logs = await this.getFilteredLogs(normalizedDays);

    if (logs.length === 0) {
      return [];
    }

    const modelCounts = new Map<string, number>();
    logs.forEach((log) => {
      const count = modelCounts.get(log.model) || 0;
      modelCounts.set(log.model, count + 1);
    });

    const total = logs.length;
    return Array.from(modelCounts.entries())
      .map(([model, request_count]) => ({
        model,
        request_count,
        percentage: total > 0 ? (request_count / total) * 100 : 0,
      }))
      .sort((a, b) => b.request_count - a.request_count)
      .slice(0, 15);
  }

  async getDailyTokenTrend(
    days = DEFAULT_DASHBOARD_DAYS,
  ): Promise<DailyTokenTrend[]> {
    const normalizedDays = normalizeDays(days, DEFAULT_DASHBOARD_DAYS);
    const logs = await this.getFilteredLogs(normalizedDays);

    const dailyData = new Map<string, { prompt: number; completion: number }>();

    logs
      .filter((log): log is SpendLogResponse & { startTime: string } =>
        Boolean(log.startTime),
      )
      .forEach((log) => {
        const date = getDayKey(log.startTime);
        if (!dailyData.has(date)) {
          dailyData.set(date, { prompt: 0, completion: 0 });
        }
        const data = dailyData.get(date);
        if (data) {
          data.prompt += Number(log.prompt_tokens || 0);
          data.completion += Number(log.completion_tokens || 0);
        }
      });

    return Array.from(dailyData.entries())
      .map(([date, data]) => ({
        date,
        prompt_tokens: data.prompt,
        completion_tokens: data.completion,
        total_tokens: data.prompt + data.completion,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async getModelStatistics(
    days = DEFAULT_DASHBOARD_DAYS,
  ): Promise<ModelStatistics[]> {
    const normalizedDays = normalizeDays(days, DEFAULT_DASHBOARD_DAYS);
    const logs = await this.getFilteredLogs(normalizedDays);

    const modelData = new Map<
      string,
      {
        spend: number;
        prompt: number;
        completion: number;
        request_count: number;
        latencies: number[];
        successes: number;
        errors: number;
        userSet: Set<string>;
        keySet: Set<string>;
        times: number[];
      }
    >();

    logs.forEach((log) => {
      const model = log.model;
      if (!modelData.has(model)) {
        modelData.set(model, {
          spend: 0,
          prompt: 0,
          completion: 0,
          request_count: 0,
          latencies: [],
          successes: 0,
          errors: 0,
          userSet: new Set(),
          keySet: new Set(),
          times: [],
        });
      }

      const data = modelData.get(model);
      if (!data) {
        return;
      }

      data.spend += Number(log.spend || log.total_spend || 0);
      data.prompt += Number(log.prompt_tokens || 0);
      data.completion += Number(log.completion_tokens || 0);
      data.request_count += 1;

      if (log.user) data.userSet.add(log.user);
      if (log.api_key) data.keySet.add(log.api_key);
      if (log.startTime) data.times.push(new Date(log.startTime).getTime());

      if (log.startTime && log.endTime) {
        const start = new Date(log.startTime).getTime();
        const end = new Date(log.endTime).getTime();
        if (end > start) {
          data.latencies.push(end - start);
        }
      }

      if (log.status === 'success') {
        data.successes++;
      } else {
        data.errors++;
      }
    });

    return Array.from(modelData.entries()).map(([model, data]) => {
      const total_tokens = data.prompt + data.completion;
      const sortedLatencies = [...data.latencies].sort((a, b) => a - b);
      const sortedTimes = [...data.times].sort((a, b) => a - b);
      const avgLatency =
        data.latencies.length > 0
          ? data.latencies.reduce((acc, value) => acc + value, 0) /
            data.latencies.length
          : 0;

      return {
        model,
        request_count: data.request_count,
        total_spend: data.spend,
        total_tokens,
        prompt_tokens: data.prompt,
        completion_tokens: data.completion,
        avg_tokens_per_request:
          data.request_count > 0 ? total_tokens / data.request_count : 0,
        avg_latency_ms: avgLatency,
        success_rate:
          data.request_count > 0
            ? (data.successes / data.request_count) * 100
            : 0,
        error_count: data.errors,
        avg_input_cost: 0,
        avg_output_cost: 0,
        p50_latency_ms:
          sortedLatencies[Math.floor(sortedLatencies.length * 0.5)] || 0,
        p95_latency_ms:
          sortedLatencies[Math.floor(sortedLatencies.length * 0.95)] || 0,
        p99_latency_ms:
          sortedLatencies[Math.floor(sortedLatencies.length * 0.99)] || 0,
        first_seen: sortedTimes[0]
          ? new Date(sortedTimes[0]).toISOString()
          : null,
        last_seen: sortedTimes[sortedTimes.length - 1]
          ? new Date(sortedTimes[sortedTimes.length - 1]).toISOString()
          : null,
        unique_users: data.userSet.size,
        unique_api_keys: data.keySet.size,
      };
    });
  }

  async getModels(): Promise<ModelEntry[]> {
    const response = await this.fetchWithAuth<ModelsResponse>('/v1/models');

    if (!response?.data || !Array.isArray(response.data)) {
      return [];
    }

    return response.data.map((model) => ({
      modelName: model.id,
      litellmParams: null,
    }));
  }

  async getModelDetails(): Promise<ModelDetail[]> {
    return [];
  }

  async getErrorLogs(
    _limit: number,
    _days = DEFAULT_DASHBOARD_DAYS,
  ): Promise<ErrorLogEntry[]> {
    return [];
  }

  async createModel(_model: {
    modelName: string;
    litellmParams: Record<string, unknown>;
  }): Promise<void> {
    throw new Error('Creating models is not supported in API-only mode');
  }

  async updateModel(
    _name: string,
    _updates: { litellmParams?: Record<string, unknown>; modelName?: string },
  ): Promise<void> {
    throw new Error('Updating models is not supported in API-only mode');
  }

  async deleteModel(_name: string): Promise<void> {
    throw new Error('Deleting models is not supported in API-only mode');
  }

  async mergeModels(_source: string, _target: string): Promise<void> {
    throw new Error('Merging models is not supported in API-only mode');
  }

  async deleteModelLogs(_model: string): Promise<void> {
    throw new Error('Deleting model logs is not supported in API-only mode');
  }

  async getAgentRoutingConfig(): Promise<Record<string, unknown> | null> {
    throw new Error('Agent routing config is not supported in API-only mode');
  }

  async updateAgentRoutingConfig(
    _config: Record<string, unknown>,
  ): Promise<void> {
    throw new Error(
      'Agent routing config updates are not supported in API-only mode',
    );
  }

  async getAgentConfigs(): Promise<Record<string, unknown>> {
    throw new Error('Config file access is not supported in API-only mode');
  }

  async getCategoryConfigs(): Promise<Record<string, unknown>> {
    throw new Error('Config file access is not supported in API-only mode');
  }

  async updateAgentConfig(
    _agentKey: string,
    _config: Record<string, unknown>,
  ): Promise<void> {
    throw new Error('Config file updates are not supported in API-only mode');
  }

  async updateCategoryConfig(
    _categoryKey: string,
    _config: Record<string, unknown>,
  ): Promise<void> {
    throw new Error('Config file updates are not supported in API-only mode');
  }

  async deleteAgentConfig(_agentKey: string): Promise<void> {
    throw new Error('Config file updates are not supported in API-only mode');
  }

  async deleteCategoryConfig(_categoryKey: string): Promise<void> {
    throw new Error('Config file updates are not supported in API-only mode');
  }
}

interface SpendLogResponse {
  request_id: string;
  model: string;
  user?: string | null;
  total_tokens?: number | null;
  prompt_tokens?: number | null;
  completion_tokens?: number | null;
  spend?: number;
  total_spend?: number;
  startTime?: string;
  endTime?: string | null;
  api_key?: string | null;
  status?: string;
}

interface ModelsResponse {
  object: string;
  data: Array<{
    id: string;
    object: string;
    created: number;
    owned_by: string;
  }>;
}
