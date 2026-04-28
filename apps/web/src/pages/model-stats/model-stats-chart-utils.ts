/** Chart color palette — matches dashboard visualization palette */
export const MODEL_STATS_CHART_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#84cc16',
] as const;

/** Default chart container height in pixels */
export const CHART_HEIGHT = 300;

/** Number of items to show in bar charts (top N) */
export const TOP_N_MODELS = 8;

/** Latency chart colors for p50/p95/p99 grouping */
export const LATENCY_CHART_COLORS = {
  p50: '#3b82f6',
  p95: '#f59e0b',
  p99: '#ef4444',
} as const;

/** Error chart color */
export const ERROR_CHART_COLOR = '#ef4444';

/** Health status colors */
export const HEALTH_COLORS = {
  healthy: '#10b981',
  degraded: '#f59e0b',
  critical: '#ef4444',
} as const;
