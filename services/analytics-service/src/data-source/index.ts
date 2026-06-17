import { serverEnv } from "@lite-llm/config/server";
import type { AnalyticsDataSource } from "../types/index";

import { DatabaseDataSource } from "./database";
import { HybridDataSource } from "./hybrid";
import { ModelProxyDataSource } from "./model-proxy";

export function createDataSource(): AnalyticsDataSource {
  switch (serverEnv.ANALYTICS_DATA_SOURCE) {
    case "model-proxy":
      return new ModelProxyDataSource();
    case "hybrid":
      return new HybridDataSource(
        new DatabaseDataSource(),
        new ModelProxyDataSource(),
      );
    default:
      return new DatabaseDataSource();
  }
}

export type { AnalyticsDataSource } from "../types/index";
export { DatabaseDataSource } from "./database";
export type {
  CompareTotalsResult,
  CompareTotalsWindow,
} from "./hybrid";
export { compareTotals, HybridDataSource } from "./hybrid";
export { ModelProxyDataSource } from "./model-proxy";
