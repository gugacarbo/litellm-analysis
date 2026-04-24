export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 4,
    maximumFractionDigits: 4,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

export function formatFullDateTime(date: string | Date): string {
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function calculateTokensPerSecond(
  completionTokens: number,
  startTime: string,
  endTime: string,
): string {
  const durationMs =
    new Date(endTime).getTime() - new Date(startTime).getTime();
  if (durationMs <= 0 || !completionTokens) return '-';

  const tokensPerSec = completionTokens / (durationMs / 1000);
  return `${tokensPerSec.toFixed(1)}/s`;
}

export function maskApiKey(key: string): string {
  if (!key) return 'N/A';
  if (key.length <= 8) return key;
  return `${key.substring(0, 6)}...${key.slice(-4)}`;
}
