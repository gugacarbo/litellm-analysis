import type { AnalyticsProvider } from "./analytics-context";
import { createAnalyticsProvider } from "./analytics-context";
import type { MonitorProvider } from "./monitor-context";
import { createMonitorProvider } from "./monitor-context";

export interface AppContext {
  analytics: AnalyticsProvider;
  monitor: MonitorProvider;
}

export function createAppContext(): AppContext {
  const analytics = createAnalyticsProvider();
  const monitor = createMonitorProvider();
  return { analytics, monitor };
}
