import type { AnalyticsProvider } from "./analytics-context";
import { createAnalyticsProvider } from "./analytics-context";

export interface AppContext {
  analytics: AnalyticsProvider;
}

export function createAppContext(): AppContext {
  const analytics = createAnalyticsProvider();
  return { analytics };
}
