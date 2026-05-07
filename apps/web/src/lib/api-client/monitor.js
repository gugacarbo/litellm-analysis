import { fetchApi } from "./core";
// Functions
export async function getMonitorAlerts(params) {
  const searchParams = new URLSearchParams();
  if (params?.anomalyType) searchParams.set("anomaly_type", params.anomalyType);
  if (params?.model) searchParams.set("model", params.model);
  if (params?.severity) searchParams.set("severity", params.severity);
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.offset) searchParams.set("offset", String(params.offset));
  if (params?.since) searchParams.set("since", params.since);
  if (params?.acknowledged !== undefined)
    searchParams.set("acknowledged", String(params.acknowledged));
  const qs = searchParams.toString();
  return fetchApi(`/monitor/alerts${qs ? `?${qs}` : ""}`);
}
export async function getActiveAlerts(options) {
  return fetchApi("/monitor/alerts/active", options);
}
export async function acknowledgeAlertById(id) {
  return fetchApi(`/monitor/alerts/${id}/acknowledge`, { method: "POST" });
}
export async function getMonitorStats() {
  return fetchApi("/monitor/stats");
}
export async function getModelsHealth() {
  return fetchApi("/monitor/models/health");
}
