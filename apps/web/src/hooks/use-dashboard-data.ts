import { useCallback, useEffect, useState } from 'react';
import {
  getDailySpendTrend,
  getErrorLogs,
  getMetricsSummary,
  getModelDetails,
  getSpendByModel,
  getSpendByUser,
  getSpendLogs,
  getTokenDistribution,
  getPerformanceMetrics,
  getHourlyUsagePatterns,
  getApiKeyDetailedStats,
  getCostEfficiencyByModel,
  getModelRequestDistribution,
  getDailyTokenTrend,
} from '../lib/api-client';

export function useDashboardData() {
  const [metrics, setMetrics] = useState<{
    totalSpend: number;
    totalTokens: number;
    activeModels: number;
    errorCount: number;
  } | null>(null);
  const [spendByModel, setSpendByModel] = useState<
    { model: string; total_spend: number }[]
  >([]);
  const [spendByUser, setSpendByUser] = useState<
    { user: string; total_spend: number; total_tokens: number }[]
  >([]);
  const [dailyTrend, setDailyTrend] = useState<
    { date: string; spend: number }[]
  >([]);
  const [logs, setLogs] = useState<unknown[]>([]);
  const [models, setModels] = useState<{ model_name: string }[]>([]);
  const [errors, setErrors] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokenDistribution, setTokenDistribution] = useState<
    { model: string; prompt_tokens: number; completion_tokens: number; avg_tokens_per_request: number; input_output_ratio: number }[]
  >([]);
  const [performance, setPerformance] = useState<{
    total_requests: number;
    avg_duration_ms: number;
    success_rate: number;
  } | null>(null);
  const [hourlyPatterns, setHourlyPatterns] = useState<
    { hour: number; request_count: number; total_spend: number; total_tokens: number }[]
  >([]);
  const [apiKeyStats, setApiKeyStats] = useState<
    { key: string; request_count: number; total_spend: number; total_tokens: number; avg_tokens_per_request: number; success_rate: number; last_used: string }[]
  >([]);
  const [costEfficiency, setCostEfficiency] = useState<
    { model: string; total_spend: number; total_tokens: number; cost_per_1k_tokens: number; request_count: number }[]
  >([]);
  const [modelDistribution, setModelDistribution] = useState<
    { model: string; request_count: number; percentage: number }[]
  >([]);
  const [dailyTokenTrend, setDailyTokenTrend] = useState<
    { date: string; prompt_tokens: number; completion_tokens: number; total_tokens: number }[]
  >([]);

  const fetchData = useCallback(async () => {
    try {
      const [
        metricsData,
        modelData,
        userData,
        trendData,
        logsData,
        modelDetails,
        errorData,
        tokenDistData,
        perfData,
        hourlyData,
        keyStatsData,
        costEffData,
        modelDistData,
        tokenTrendData,
      ] = await Promise.all([
        getMetricsSummary(),
        getSpendByModel(),
        getSpendByUser(),
        getDailySpendTrend(30),
        getSpendLogs({ limit: 50 }),
        getModelDetails(),
        getErrorLogs(50),
        getTokenDistribution(),
        getPerformanceMetrics(),
        getHourlyUsagePatterns(),
        getApiKeyDetailedStats(),
        getCostEfficiencyByModel(),
        getModelRequestDistribution(),
        getDailyTokenTrend(30),
      ]);

      setMetrics(metricsData);
      setSpendByModel(modelData);
      setSpendByUser(userData);
      setDailyTrend(trendData);
      setLogs(logsData);
      setModels(modelDetails);
      setErrors(errorData);
      setTokenDistribution(tokenDistData);
      setPerformance(perfData);
      setHourlyPatterns(hourlyData);
      setApiKeyStats(keyStatsData);
      setCostEfficiency(costEffData);
      setModelDistribution(modelDistData);
      setDailyTokenTrend(tokenTrendData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  return {
    metrics,
    spendByModel,
    spendByUser,
    dailyTrend,
    logs,
    models,
    errors,
    loading,
    error,
    refetch: fetchData,
    tokenDistribution,
    performance,
    hourlyPatterns,
    apiKeyStats,
    costEfficiency,
    modelDistribution,
    dailyTokenTrend,
  };
}
