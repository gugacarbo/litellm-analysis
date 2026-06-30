import { fetchApi } from "./core";

interface HealthCheckResult {
  id: number;
  modelName: string;
  status: "healthy" | "unhealthy" | "error";
  responseTimeMs: number | null;
  ttftMs: number | null;
  outputTokens: number | null;
  tokensPerSecond: number | null;
  statusCode: number | null;
  promptSent: string;
  responseReceived: string | null;
  requestPayload: string | null;
  responsePayload: string | null;
  errorMessage: string | null;
  source: "scheduled" | "manual";
  checkedAt: number;
}

export interface GetHealthCheckResultsResponse {
  checks: HealthCheckResult[];
  total: number;
  limit: number;
  offset: number;
}

export interface GetLatestHealthChecksResponse {
  checks: HealthCheckResult[];
}

export interface HealthCheckSummary {
  healthy: number;
  unhealthy: number;
  error: number;
  total: number;
}

export interface RunHealthCheckResponse {
  triggered: boolean;
}

export async function getHealthCheckResults(params?: {
  model?: string;
  limit?: number;
  offset?: number;
  since?: string;
}): Promise<GetHealthCheckResultsResponse> {
  const searchParams = new URLSearchParams();
  if (params?.model) searchParams.set("model", params.model);
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.offset) searchParams.set("offset", String(params.offset));
  if (params?.since) searchParams.set("since", params.since);
  const qs = searchParams.toString();
  return fetchApi(`/health-check/results${qs ? `?${qs}` : ""}`);
}

export async function getLatestHealthChecks(): Promise<GetLatestHealthChecksResponse> {
  return fetchApi("/health-check/latest");
}

export async function getHealthCheckSummary(): Promise<HealthCheckSummary> {
  return fetchApi("/health-check/summary");
}

export async function runHealthCheck(
  models?: string[],
): Promise<RunHealthCheckResponse> {
  return fetchApi("/health-check/run", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ models }),
  });
}
