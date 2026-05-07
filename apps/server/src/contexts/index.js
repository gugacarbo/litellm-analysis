import { createAnalyticsProvider } from "./analytics-context";
import { createMonitorProvider } from "./monitor-context";
export function createAppContext() {
  const analytics = createAnalyticsProvider();
  const monitor = createMonitorProvider();
  return { analytics, monitor };
}
