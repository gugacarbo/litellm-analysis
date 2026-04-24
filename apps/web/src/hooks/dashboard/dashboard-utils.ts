import type {
  ApiKeyStatItem,
  DashboardMetrics,
  PerformanceMetrics,
  SpendByUserItem,
} from '../../pages/dashboard/dashboard-types';

type RawMetrics = {
  totalSpend?: number;
  totalTokens?: number;
  activeModels?: number;
  errorCount?: number;
  total_spend?: number;
  total_tokens?: number;
  active_models?: number;
  error_count?: number;
};

export function normalizeMetrics(
  raw: RawMetrics | null | undefined,
): DashboardMetrics {
  return {
    totalSpend: Number(raw?.totalSpend ?? raw?.total_spend ?? 0),
    totalTokens: Number(raw?.totalTokens ?? raw?.total_tokens ?? 0),
    activeModels: Number(raw?.activeModels ?? raw?.active_models ?? 0),
    errorCount: Number(raw?.errorCount ?? raw?.error_count ?? 0),
  };
}

export function normalizePerformance(
  raw: PerformanceMetrics | null | undefined,
): PerformanceMetrics {
  return {
    total_requests: Number(raw?.total_requests ?? 0),
    avg_duration_ms: Number(raw?.avg_duration_ms ?? 0),
    success_rate: normalizePercent(Number(raw?.success_rate ?? 0)),
  };
}

export function normalizeApiKeyStats(apiKeyStats: ApiKeyStatItem[]): ApiKeyStatItem[] {
  return apiKeyStats.map((keyStats) => ({
    ...keyStats,
    key: keyStats.key || 'Unknown',
    success_rate: normalizePercent(Number(keyStats.success_rate ?? 0)),
  }));
}

export function normalizeSpendByUser(
  spendByUser: SpendByUserItem[],
): SpendByUserItem[] {
  return spendByUser.map((item) => ({
    user: item.user || 'Anonymous',
    total_spend: Number(item.total_spend ?? 0),
    total_tokens: Number(item.total_tokens ?? 0),
    request_count: Number(item.request_count ?? 0),
  }));
}

export function normalizePercent(value: number): number {
  return Math.min(Math.max(value, 0), 100);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value / 100);
}

export function safeDivide(numerator: number, denominator: number): number {
  return denominator !== 0 ? numerator / denominator : 0;
}

export function getToneByDelta(value: number): 'positive' | 'negative' | 'warning' | 'neutral' {
  if (value > 10) {
    return 'warning';
  }
  if (value < -10) {
    return 'positive';
  }
  return 'neutral';
}
