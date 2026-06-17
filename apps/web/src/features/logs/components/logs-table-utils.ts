import type { ProxyRequestLog } from "@/shared/lib/api-client/spend";
import {
  getProxyLogDurationMs,
  getProxyLogInputTokens,
  getProxyLogOutputTokens,
  getProxyLogTotalCost,
  isProxyLogSuccess,
} from "@/shared/lib/spend-log-utils";

export type LogGroup = {
  model: string;
  logs: ProxyRequestLog[];
};

export type GroupSummary = {
  totalCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalDurationMs: number;
  averageTokensPerSecond: number | null;
  averageTimeToFirstTokenMs: number | null;
  groupStatus: "success" | "error" | "partial";
};

export function groupLogsByModel(logs: ProxyRequestLog[]): LogGroup[] {
  const groupsByModel = new Map<string, LogGroup>();
  const groups: LogGroup[] = [];

  for (const log of logs) {
    const existingGroup = groupsByModel.get(log.model);
    if (existingGroup) {
      existingGroup.logs.push(log);
      continue;
    }

    const newGroup: LogGroup = { model: log.model, logs: [log] };
    groupsByModel.set(log.model, newGroup);
    groups.push(newGroup);
  }

  return groups;
}

export function calculateGroupSummary(group: LogGroup): GroupSummary {
  const totalCost = group.logs.reduce(
    (sum, log) => sum + getProxyLogTotalCost(log),
    0,
  );
  const totalInputTokens = group.logs.reduce(
    (sum, log) => sum + getProxyLogInputTokens(log),
    0,
  );
  const totalOutputTokens = group.logs.reduce(
    (sum, log) => sum + getProxyLogOutputTokens(log),
    0,
  );
  const totalTokens = group.logs.reduce(
    (sum, log) => sum + (log.total_tokens ?? 0),
    0,
  );
  const totalDurationMs = group.logs.reduce(
    (sum, log) => sum + getProxyLogDurationMs(log),
    0,
  );

  const tokensPerSecondValues = group.logs
    .map((log) => {
      const durationMs = getProxyLogDurationMs(log);
      const outputTokens = getProxyLogOutputTokens(log);
      if (durationMs <= 0 || !outputTokens) {
        return null;
      }
      return outputTokens / (durationMs / 1000);
    })
    .filter((value): value is number => value !== null);
  const averageTokensPerSecond =
    tokensPerSecondValues.length > 0
      ? tokensPerSecondValues.reduce((sum, value) => sum + value, 0) /
        tokensPerSecondValues.length
      : null;

  const timeToFirstTokenValues = group.logs
    .map((log) => log.ttft_ms)
    .filter((value): value is number => value !== null && !Number.isNaN(value));
  const averageTimeToFirstTokenMs =
    timeToFirstTokenValues.length > 0
      ? timeToFirstTokenValues.reduce((sum, value) => sum + value, 0) /
        timeToFirstTokenValues.length
      : null;

  const successCount = group.logs.filter((log) =>
    isProxyLogSuccess(log.status),
  ).length;
  const groupStatus =
    successCount === group.logs.length
      ? "success"
      : successCount === 0
        ? "error"
        : "partial";

  return {
    totalCost,
    totalInputTokens,
    totalOutputTokens,
    totalTokens,
    totalDurationMs,
    averageTokensPerSecond,
    averageTimeToFirstTokenMs,
    groupStatus,
  };
}
