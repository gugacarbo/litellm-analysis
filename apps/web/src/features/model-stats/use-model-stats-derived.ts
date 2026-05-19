import { useMemo } from "react";
import type {
  ModelInsight,
  ModelStats,
  SortDirection,
  SortField,
} from "./model-stats-types";
import {
  formatCostPer1k,
  formatDuration,
  formatNumber,
  formatPercent,
  safeDivide,
} from "./model-stats-utils";

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
  byLatency.sort((a, b) => Number(a.p50_latency_ms) - Number(b.p50_latency_ms));

  const bySlow = withMinReqs(100);
  bySlow.sort((a, b) => Number(b.p95_latency_ms) - Number(a.p95_latency_ms));

  const byErrors = [...data].sort(
    (a, b) => Number(b.error_count) - Number(a.error_count),
  );

  const insights: ModelInsight[] = [];

  if (byCost.length > 0) {
    const cheapest = byCost[0];
    const combinedCost =
      Number(cheapest.avg_input_cost) + Number(cheapest.avg_output_cost);
    insights.push({
      label: "Cheapest Model",
      value: cheapest.model || "(unknown)",
      detail: `${formatCostPer1k(combinedCost)} combined cost`,
      tone: "positive",
    });
  }

  if (byCost.length > 1) {
    const expensive = byCost[byCost.length - 1];
    const combinedCost =
      Number(expensive.avg_input_cost) + Number(expensive.avg_output_cost);
    const share = safeDivide(Number(expensive.total_spend), totalSpend) * 100;
    insights.push({
      label: "Most Expensive",
      value: expensive.model || "(unknown)",
      detail: `${formatCostPer1k(combinedCost)} combined · ${formatPercent(share)} of spend`,
      tone: share > 30 ? "warning" : "neutral",
    });
  }

  if (byLatency.length > 0) {
    const fastest = byLatency[0];
    insights.push({
      label: "Fastest Response",
      value: fastest.model || "(unknown)",
      detail: `${formatDuration(fastest.p50_latency_ms)} p50 latency`,
      tone: "positive",
    });
  }

  if (bySlow.length > 0) {
    const slowest = bySlow[0];
    insights.push({
      label: "Slowest Response",
      value: slowest.model || "(unknown)",
      detail: `${formatDuration(slowest.p95_latency_ms)} p95 latency`,
      tone: "warning",
    });
  }

  const byRequests = [...data].sort(
    (a, b) => Number(b.request_count) - Number(a.request_count),
  );
  if (byRequests.length > 0) {
    const popular = byRequests[0];
    const share =
      safeDivide(Number(popular.request_count), totalRequests) * 100;
    insights.push({
      label: "Most Popular",
      value: popular.model || "(unknown)",
      detail: `${formatNumber(popular.request_count)} requests · ${formatPercent(share)}`,
      tone: "neutral",
    });
  }

  if (byErrors.length > 0 && Number(byErrors[0].error_count) > 0) {
    const hotspot = byErrors[0];
    insights.push({
      label: "Error Hotspot",
      value: hotspot.model || "(unknown)",
      detail: `${formatNumber(hotspot.error_count)} errors`,
      tone: Number(hotspot.error_count) > 10 ? "negative" : "warning",
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
  const processed = useMemo(() => {
    const filtered = data.filter((m) => {
      const modelName = m.model ?? "";
      return modelName.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const sorted = [...filtered].sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDirection === "asc"
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      return sortDirection === "asc"
        ? Number(aVal) - Number(bVal)
        : Number(bVal) - Number(aVal);
    });

    return { filteredData: filtered, sortedData: sorted };
  }, [data, searchQuery, sortField, sortDirection]);

  const aggregates = useMemo(() => {
    const acc = data.reduce(
      (sums, m) => {
        const reqs = Number(m.request_count);
        sums.totalSpend += Number(m.total_spend);
        sums.totalRequests += reqs;
        sums.totalTokens += Number(m.total_tokens);
        sums.totalErrors += Number(m.error_count);
        sums.totalPromptTokens += Number(m.prompt_tokens);
        sums.totalCompletionTokens += Number(m.completion_tokens);
        sums.weightedSuccessRate += Number(m.success_rate) * reqs;
        sums.weightedLatency += Number(m.avg_latency_ms) * reqs;
        sums.weightedTokensPerSecond += Number(m.avg_tokens_per_second) * reqs;
        return sums;
      },
      {
        totalSpend: 0,
        totalRequests: 0,
        totalTokens: 0,
        totalErrors: 0,
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        weightedSuccessRate: 0,
        weightedLatency: 0,
        weightedTokensPerSecond: 0,
      },
    );

    const avgSuccessRate =
      acc.totalRequests > 0 ? acc.weightedSuccessRate / acc.totalRequests : 0;

    const avgLatency =
      acc.totalRequests > 0 ? acc.weightedLatency / acc.totalRequests : 0;
    const avgTokensPerSecond =
      acc.totalRequests > 0
        ? acc.weightedTokensPerSecond / acc.totalRequests
        : 0;

    const avgCostPerRequest = safeDivide(acc.totalSpend, acc.totalRequests);
    const avgCostPer1kTokens = safeDivide(
      acc.totalSpend,
      safeDivide(acc.totalTokens, 1000),
    );
    const inputOutputRatio = safeDivide(
      acc.totalPromptTokens,
      acc.totalCompletionTokens,
    );
    const errorRate = safeDivide(acc.totalErrors, acc.totalRequests) * 100;

    const insights = computeInsights(data, acc.totalSpend, acc.totalRequests);

    const bySpend = [...data].sort(
      (a, b) => Number(b.total_spend) - Number(a.total_spend),
    );
    const topSpendModel =
      bySpend.length > 0 ? bySpend[0].model || "(unknown)" : "";
    const topSpendValue =
      bySpend.length > 0 ? Number(bySpend[0].total_spend) : 0;
    const maxTokensPerSecond =
      data.length > 0
        ? Math.max(...data.map((m) => Number(m.max_tokens_per_second) || 0))
        : 0;

    const byEfficiency = [...data].sort((a, b) => {
      const costA = safeDivide(
        Number(a.total_spend),
        safeDivide(Number(a.total_tokens), 1000),
      );
      const costB = safeDivide(
        Number(b.total_spend),
        safeDivide(Number(b.total_tokens), 1000),
      );
      return costA - costB;
    });
    const topEfficiencyModel =
      byEfficiency.length > 0 ? byEfficiency[0].model || "(unknown)" : "";
    const bestCostPer1k =
      byEfficiency.length > 0
        ? safeDivide(
            Number(byEfficiency[0].total_spend),
            safeDivide(Number(byEfficiency[0].total_tokens), 1000),
          )
        : 0;

    return {
      totalSpend: acc.totalSpend,
      totalRequests: acc.totalRequests,
      totalTokens: acc.totalTokens,
      avgSuccessRate,
      totalErrors: acc.totalErrors,
      totalPromptTokens: acc.totalPromptTokens,
      totalCompletionTokens: acc.totalCompletionTokens,
      avgLatency,
      avgTokensPerSecond,
      avgCostPerRequest,
      avgCostPer1kTokens,
      inputOutputRatio,
      errorRate,
      insights,
      uniqueModels: data.length,
      topSpendModel,
      topSpendValue,
      maxTokensPerSecond,
      topEfficiencyModel,
      bestCostPer1k,
    };
  }, [data]);

  return {
    filteredData: processed.filteredData,
    sortedData: processed.sortedData,
    ...aggregates,
  };
}
