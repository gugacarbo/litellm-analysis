import { fetchApi } from "./core";

function withDays(endpoint, days) {
  if (days === undefined) {
    return endpoint;
  }
  const separator = endpoint.includes("?") ? "&" : "?";
  return `${endpoint}${separator}days=${days}`;
}
export async function getModelDetails() {
  return fetchApi("/model/details");
}
export async function getErrorLogs(limit = 50, days, options) {
  return fetchApi(withDays(`/errors?limit=${limit}`, days), options);
}
export async function getMetricsSummary(days) {
  return fetchApi(withDays("/metrics", days));
}
export async function getTokenDistribution(days) {
  return fetchApi(withDays("/analytics/tokens", days));
}
export async function getPerformanceMetrics(days) {
  return fetchApi(withDays("/analytics/performance", days));
}
export async function getHourlyUsagePatterns(days) {
  return fetchApi(withDays("/analytics/temporal", days));
}
export async function getApiKeyDetailedStats(days) {
  return fetchApi(withDays("/analytics/keys", days));
}
export async function getCostEfficiencyByModel(days) {
  return fetchApi(withDays("/analytics/cost-efficiency", days));
}
export async function getModelRequestDistribution(days) {
  return fetchApi(withDays("/analytics/model-distribution", days));
}
export async function getDailyTokenTrend(days = 30) {
  return fetchApi(`/analytics/token-trend?days=${days}`);
}
export async function getModelStatistics(days) {
  return fetchApi(withDays("/analytics/model-stats", days));
}
export async function getModelDailySpend(model, days) {
  return fetchApi(
    withDays(
      `/analytics/model-daily-spend?model=${encodeURIComponent(model)}`,
      days,
    ),
  );
}
export async function getModelDailyTokens(model, days) {
  return fetchApi(
    withDays(
      `/analytics/model-daily-tokens?model=${encodeURIComponent(model)}`,
      days,
    ),
  );
}
export async function getModelHourlyUsage(model, days) {
  return fetchApi(
    withDays(
      `/analytics/model-hourly-usage?model=${encodeURIComponent(model)}`,
      days,
    ),
  );
}
export async function getModelLatencyTrend(model, days) {
  return fetchApi(
    withDays(
      `/analytics/model-latency-trend?model=${encodeURIComponent(model)}`,
      days,
    ),
  );
}
export async function getModelErrorBreakdown(model, days) {
  return fetchApi(
    withDays(
      `/analytics/model-error-breakdown?model=${encodeURIComponent(model)}`,
      days,
    ),
  );
}
export async function getModelDailyErrors(model, days) {
  return fetchApi(
    withDays(
      `/analytics/model-daily-errors?model=${encodeURIComponent(model)}`,
      days,
    ),
  );
}
export async function getModelTopUsers(model, days) {
  return fetchApi(
    withDays(
      `/analytics/model-top-users?model=${encodeURIComponent(model)}`,
      days,
    ),
  );
}
export async function getModelTopApiKeys(model, days) {
  return fetchApi(
    withDays(
      `/analytics/model-top-api-keys?model=${encodeURIComponent(model)}`,
      days,
    ),
  );
}
export async function getModelCacheHitRate(model, days) {
  return fetchApi(
    withDays(
      `/analytics/model-cache-hit-rate?model=${encodeURIComponent(model)}`,
      days,
    ),
  );
}
export async function getModelTTFT(model, days) {
  return fetchApi(
    withDays(`/analytics/model-ttft?model=${encodeURIComponent(model)}`, days),
  );
}
export async function getModelStatusDistribution(model, days) {
  return fetchApi(
    withDays(
      `/analytics/model-status-distribution?model=${encodeURIComponent(model)}`,
      days,
    ),
  );
}
export async function getModelProviderBreakdown(model, days) {
  return fetchApi(
    withDays(
      `/analytics/model-provider-breakdown?model=${encodeURIComponent(model)}`,
      days,
    ),
  );
}
