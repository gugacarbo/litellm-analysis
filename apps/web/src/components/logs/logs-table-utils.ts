import type { SpendLog } from '../../types/analytics';

export type LogGroup = {
  model: string;
  logs: SpendLog[];
};

export type GroupSummary = {
  totalSpend: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  totalDurationMs: number;
  averageTokensPerSecond: number | null;
  averageTimeToFirstTokenMs: number | null;
  groupStatus: 'success' | 'error' | 'partial';
};

export function groupLogsByModel(logs: SpendLog[]): LogGroup[] {
  const groups: LogGroup[] = [];
  let currentGroup: LogGroup | null = null;

  for (const log of logs) {
    if (currentGroup && currentGroup.model === log.model) {
      currentGroup.logs.push(log);
    } else {
      if (currentGroup) {
        groups.push(currentGroup);
      }
      currentGroup = { model: log.model, logs: [log] };
    }
  }
  if (currentGroup) {
    groups.push(currentGroup);
  }

  return groups;
}

export function calculateGroupSummary(group: LogGroup): GroupSummary {
  const totalSpend = group.logs.reduce((sum, log) => sum + log.spend, 0);
  const totalPromptTokens = group.logs.reduce(
    (sum, log) => sum + log.prompt_tokens,
    0,
  );
  const totalCompletionTokens = group.logs.reduce(
    (sum, log) => sum + log.completion_tokens,
    0,
  );
  const totalTokens = group.logs.reduce(
    (sum, log) => sum + log.total_tokens,
    0,
  );
  const totalDurationMs = group.logs.reduce((sum, log) => {
    const start = new Date(log.start_time).getTime();
    const end = new Date(log.end_time).getTime();
    return sum + (end - start);
  }, 0);

  const tokensPerSecondValues = group.logs
    .map((log) => {
      const start = new Date(log.start_time).getTime();
      const end = new Date(log.end_time).getTime();
      const durationMs = end - start;
      if (durationMs <= 0 || !log.completion_tokens) {
        return null;
      }
      return log.completion_tokens / (durationMs / 1000);
    })
    .filter((value): value is number => value !== null);
  const averageTokensPerSecond =
    tokensPerSecondValues.length > 0
      ? tokensPerSecondValues.reduce((sum, value) => sum + value, 0) /
        tokensPerSecondValues.length
      : null;

  const timeToFirstTokenValues = group.logs
    .map((log) => log.time_to_first_token_ms)
    .filter(
      (value): value is number =>
        value !== null && !Number.isNaN(value),
    );
  const averageTimeToFirstTokenMs =
    timeToFirstTokenValues.length > 0
      ? timeToFirstTokenValues.reduce((sum, value) => sum + value, 0) /
        timeToFirstTokenValues.length
      : null;

  const successCount = group.logs.filter(
    (log) => log.status === '200' || log.status === 'success',
  ).length;
  const groupStatus =
    successCount === group.logs.length
      ? 'success'
      : successCount === 0
        ? 'error'
        : 'partial';

  return {
    totalSpend,
    totalPromptTokens,
    totalCompletionTokens,
    totalTokens,
    totalDurationMs,
    averageTokensPerSecond,
    averageTimeToFirstTokenMs,
    groupStatus,
  };
}
