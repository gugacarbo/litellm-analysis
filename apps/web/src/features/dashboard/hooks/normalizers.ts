import type {
  ApiKeyStatItem,
  DashboardInsight,
  DashboardMetrics,
  PerformanceMetrics,
  SpendByUserItem,
} from "../types/dashboard-types";
import { normalizePercent } from "../utils/dashboard-utils";

export type RawMetrics = {
  totalSpend?: number;
  totalTokens?: number;
  activeModels?: number;
  errorCount?: number;
  promptTokens?: number;
  completionTokens?: number;
  total_spend?: number;
  total_tokens?: number;
  active_models?: number;
  error_count?: number;
  prompt_tokens?: number;
  completion_tokens?: number;
};

export function normalizeMetrics(
  raw: RawMetrics | null | undefined,
): DashboardMetrics {
  return {
    totalSpend: Number(raw?.totalSpend ?? raw?.total_spend ?? 0),
    totalTokens: Number(raw?.totalTokens ?? raw?.total_tokens ?? 0),
    activeModels: Number(raw?.activeModels ?? raw?.active_models ?? 0),
    errorCount: Number(raw?.errorCount ?? raw?.error_count ?? 0),
    promptTokens: Number(raw?.promptTokens ?? raw?.prompt_tokens ?? 0),
    completionTokens: Number(
      raw?.completionTokens ?? raw?.completion_tokens ?? 0,
    ),
  };
}

export function normalizePerformance(
  raw: PerformanceMetrics | null | undefined,
): PerformanceMetrics {
  return {
    total_requests: Number(raw?.total_requests ?? 0),
    avg_duration_ms: Number(raw?.avg_duration_ms ?? 0),
    success_rate: normalizePercent(Number(raw?.success_rate ?? 0)),
    avg_tokens_per_second: Number(raw?.avg_tokens_per_second ?? 0),
  };
}

export function normalizeApiKeyStats(
  apiKeyStats: ApiKeyStatItem[],
): ApiKeyStatItem[] {
  return apiKeyStats.map((keyStats) => ({
    ...keyStats,
    key: keyStats.key || "Unknown",
    success_rate: normalizePercent(Number(keyStats.success_rate ?? 0)),
  }));
}

export function normalizeSpendByUser(
  spendByUser: SpendByUserItem[],
): SpendByUserItem[] {
  return spendByUser.map((item) => ({
    user: item.user || "Anonymous",
    total_spend: Number(item.total_spend ?? 0),
    total_tokens: Number(item.total_tokens ?? 0),
    request_count: Number(item.request_count ?? 0),
  }));
}

export function getToneByDelta(value: number): DashboardInsight["tone"] {
  if (value > 10) {
    return "warning";
  }
  if (value < -10) {
    return "positive";
  }
  return "neutral";
}
