import type { ModelHealthEntry, MonitorAlert } from "@/shared/types/monitor";
import { fetchApi } from "./core";

interface GetAlertsResponse {
  alerts: MonitorAlert[];
  total: number;
  limit: number;
  offset: number;
}

export interface MonitorStats {
  total_alerts: number;
  active_alerts: number;
  alerts_by_type: Record<string, number>;
  alerts_by_severity: Record<string, number>;
  last_24h_count: number;
}

interface ModelHealthResponse {
  models: ModelHealthEntry[];
}

// Functions
export async function getMonitorAlerts(params?: {
  anomalyType?: string;
  model?: string;
  severity?: string;
  limit?: number;
  offset?: number;
  since?: string;
  acknowledged?: boolean;
}): Promise<GetAlertsResponse> {
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

export async function getActiveAlerts(
  options?: RequestInit,
): Promise<{ alerts: MonitorAlert[] }> {
  return fetchApi("/monitor/alerts/active", options);
}

export async function acknowledgeAlertById(
  id: number,
): Promise<{ success: boolean; alert: MonitorAlert }> {
  return fetchApi(`/monitor/alerts/${id}/acknowledge`, { method: "POST" });
}

export async function getMonitorStats(): Promise<MonitorStats> {
  return fetchApi("/monitor/stats");
}

export async function getModelsHealth(): Promise<ModelHealthResponse> {
  return fetchApi("/monitor/models/health");
}
