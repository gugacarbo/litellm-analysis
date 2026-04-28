import { useMemo } from 'react';
import type { ModelInsight, ModelStats, SortDirection, SortField } from './model-stats-types';
import {
  formatCostPer1k,
  formatDuration,
  formatNumber,
  formatPercent,
  safeDivide,
} from './model-stats-utils';

function computeInsights(
  data: ModelStats[],
  totalSpend: number,
  totalRequests: number,
): ModelInsight[] {
  if (data.length === 0) return [];

  const withMinReqs = (min: number) =>
    data.filter((m) => Number(m.request_count) >= min);

  const byCost = [...data].sort(
    (a, b) =>
      Number(a.avg_input_cost) +
      Number(a.avg_output_cost) -
      (Number(b.avg_input_cost) + Number(b.avg_output_cost)),
  );

  const byLatency = withMinReqs(100);
  byLatency.sort(
    (a, b) => Number(a.p50_latency_ms) - Number(b.p50_latency_ms),
  );

  const bySlow = withMinReqs(100);
  bySlow.sort(
    (a, b) => Number(b.p95_latency_ms) - Number(a.p95_latency_ms),
  );

  const byErrors = [...data].sort(
    (a, b) => Number(b.error_count) - Number(a.error_count),
  );

  const insights: ModelInsight[] = [];

  if (byCost.length > 0) {
    const cheapest = byCost[0];
    const combinedCost =
      Number(cheapest.avg_input_cost) + Number(cheapest.avg_output_cost);
    insights.push({
      label: 'Cheapest Model',
      value: cheapest.model || '(unknown)',
      detail: `${formatCostPer1k(combinedCost)} combined cost`,
      tone: 'positive',
    });
  }

  if (byCost.length > 1) {
    const expensive = byCost[byCost.length - 1];
    const combinedCost =
      Number(expensive.avg_input_cost) + Number(expensive.avg_output_cost);
    const share = safeDivide(Number(expensive.total_spend), totalSpend) * 100;
    insights.push({
      label: 'Most Expensive',
      value: expensive.model || '(unknown)',
      detail: `${formatCostPer1k(combinedCost)} combined · ${formatPercent(share)} of spend`,
      tone: share > 30 ? 'warning' : 'neutral',
    });
  }

  if (byLatency.length > 0) {
    const fastest = byLatency[0];
    insights.push({
      label: 'Fastest Response',
      value: fastest.model || '(unknown)',
      detail: `${formatDuration(fastest.p50_latency_ms)} p50 latency`,
      tone: 'positive',
    });
  }

  if (bySlow.length > 0) {
    const slowest = bySlow[0];
    insights.push({
      label: 'Slowest Response',
      value: slowest.model || '(unknown)',
      detail: `${formatDuration(slowest.p95_latency_ms)} p95 latency`,
      tone: 'warning',
    });
  }

  const byRequests = [...data].sort(
    (a, b) => Number(b.request_count) - Number(a.request_count),
  );
  if (byRequests.length > 0) {
    const popular = byRequests[0];
    const share = safeDivide(
      Number(popular.request_count),
      totalRequests,
    ) * 100;
    insights.push({
      label: 'Most Popular',
      value: popular.model || '(unknown)',
      detail: `${formatNumber(popular.request_count)} requests · ${formatPercent(share)}`,
      tone: 'neutral',
    });
  }

  if (byErrors.length > 0 && Number(byErrors[0].error_count) > 0) {
    const hotspot = byErrors[0];
    insights.push({
      label: 'Error Hotspot',
      value: hotspot.model || '(unknown)',
      detail: `${formatNumber(hotspot.error_count)} errors`,
      tone: Number(hotspot.error_count) > 10 ? 'negative' : 'warning',
    });
  }

  return insights;
}

export function useModelStatsDerived(
  data: ModelStats[],
  searchQuery: string,
  sortField: SortField,
  sortDirection: SortDirection,
) {
  const filteredData = useMemo(
    () =>
      data.filter((m) => {
        const modelName = m.model ?? '';
        return modelName
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      }),
    [data, searchQuery],
  );

  const sortedData = useMemo(
    () =>
      [...filteredData].sort((a, b) => {
        const aVal = a[sortField];
        const bVal = b[sortField];
        if (typeof aVal === 'string' && typeof bVal === 'string') {
          return sortDirection === 'asc'
            ? aVal.localeCompare(bVal)
            : bVal.localeCompare(aVal);
        }
        return sortDirection === 'asc'
          ? Number(aVal) - Number(bVal)
          : Number(bVal) - Number(aVal);
      }),
    [filteredData, sortField, sortDirection],
  );

  const totalSpend = useMemo(
    () => data.reduce((sum, m) => sum + Number(m.total_spend), 0),
    [data],
  );

  const totalRequests = useMemo(
    () => data.reduce((sum, m) => sum + Number(m.request_count), 0),
    [data],
  );

  const totalTokens = useMemo(
    () => data.reduce((sum, m) => sum + Number(m.total_tokens), 0),
    [data],
  );

  const avgSuccessRate = useMemo(
    () =>
      totalRequests > 0
        ? data.reduce(
            (sum, m) =>
              sum +
              Number(m.success_rate) * Number(m.request_count),
            0,
          ) / totalRequests
        : 0,
    [data, totalRequests],
  );

  const totalErrors = useMemo(
    () => data.reduce((sum, m) => sum + Number(m.error_count), 0),
    [data],
  );

  const totalPromptTokens = useMemo(
    () => data.reduce((sum, m) => sum + Number(m.prompt_tokens), 0),
    [data],
  );

  const totalCompletionTokens = useMemo(
    () =>
      data.reduce(
        (sum, m) => sum + Number(m.completion_tokens),
        0,
      ),
    [data],
  );

  const avgLatency = useMemo(
    () =>
      totalRequests > 0
        ? data.reduce(
            (sum, m) =>
              sum +
              Number(m.avg_latency_ms) *
                Number(m.request_count),
            0,
        ) / totalRequests
        : 0,
    [data, totalRequests],
  );

  const avgCostPerRequest = useMemo(
    () => safeDivide(totalSpend, totalRequests),
    [totalSpend, totalRequests],
  );

  const avgCostPer1kTokens = useMemo(
    () => safeDivide(totalSpend, safeDivide(totalTokens, 1000)),
    [totalSpend, totalTokens],
  );

  const inputOutputRatio = useMemo(
    () => safeDivide(totalPromptTokens, totalCompletionTokens),
    [totalPromptTokens, totalCompletionTokens],
  );

  const errorRate = useMemo(
    () => safeDivide(totalErrors, totalRequests) * 100,
    [totalErrors, totalRequests],
  );

  const insights = useMemo(
    () => computeInsights(data, totalSpend, totalRequests),
    [data, totalSpend, totalRequests],
  );

  return {
    filteredData,
    sortedData,
    totalSpend,
    totalRequests,
    totalTokens,
    avgSuccessRate,
    totalErrors,
    totalPromptTokens,
    totalCompletionTokens,
    avgLatency,
    avgCostPerRequest,
    avgCostPer1kTokens,
    inputOutputRatio,
    errorRate,
    insights,
    uniqueModels: data.length,
  };
}
