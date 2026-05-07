import { fetchApi } from "./core";

function withDays(endpoint, days) {
  if (days === undefined) {
    return endpoint;
  }
  const separator = endpoint.includes("?") ? "&" : "?";
  return `${endpoint}${separator}days=${days}`;
}
export async function getSpendByModel(days) {
  return fetchApi(withDays("/spend/model", days));
}
export async function getSpendLogs(params, options) {
  const searchParams = new URLSearchParams();
  if (params.model) searchParams.set("model", params.model);
  if (params.user) searchParams.set("user", params.user);
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);
  if (params.limit) searchParams.set("limit", String(params.limit));
  if (params.offset) searchParams.set("offset", String(params.offset));
  return fetchApi(`/spend/logs?${searchParams}`, options);
}
export async function getSpendLogsCount(params) {
  const searchParams = new URLSearchParams();
  if (params.model) searchParams.set("model", params.model);
  if (params.user) searchParams.set("user", params.user);
  if (params.startDate) searchParams.set("startDate", params.startDate);
  if (params.endDate) searchParams.set("endDate", params.endDate);
  const response = await fetchApi(`/spend/logs/count?${searchParams}`);
  return response.count;
}
export async function getSpendLogDetail(requestId) {
  return fetchApi(`/spend/logs/${encodeURIComponent(requestId)}`);
}
export async function getSpendByUser(days) {
  return fetchApi(withDays("/spend/user", days));
}
export async function getSpendByKey(days) {
  return fetchApi(withDays("/spend/key", days));
}
export async function getDailySpendTrend(days = 30) {
  return fetchApi(`/spend/trend?days=${days}`);
}
