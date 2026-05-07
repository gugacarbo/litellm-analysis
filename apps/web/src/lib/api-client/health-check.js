import { fetchApi } from "./core";
export async function getHealthCheckResults(params) {
  const searchParams = new URLSearchParams();
  if (params?.model) searchParams.set("model", params.model);
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.offset) searchParams.set("offset", String(params.offset));
  if (params?.since) searchParams.set("since", params.since);
  const qs = searchParams.toString();
  return fetchApi(`/health-check/results${qs ? `?${qs}` : ""}`);
}
export async function getLatestHealthChecks() {
  return fetchApi("/health-check/latest");
}
export async function getHealthCheckSummary() {
  return fetchApi("/health-check/summary");
}
export async function runHealthCheck(models) {
  return fetchApi("/health-check/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ models }),
  });
}
