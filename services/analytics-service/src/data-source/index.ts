import { serverEnv } from "@lite-llm/config/server";
import type { AnalyticsDataSource } from "../types/index";
import { HybridDataSource } from "./hybrid";
import { getLitellmDataSource } from "./litellm-loader";
import { ModelProxyDataSource } from "./model-proxy";

export function createDataSource(): AnalyticsDataSource {
  switch (serverEnv.ANALYTICS_DATA_SOURCE) {
    case "model-proxy":
      return new ModelProxyDataSource();
    case "hybrid":
      return new HybridDataSource(
        getLitellmDataSource(),
        new ModelProxyDataSource(),
      );
    default:
      return getLitellmDataSource();
  }
}

export type { AnalyticsDataSource } from "../types/index";
export type {
  CompareTotalsResult,
  CompareTotalsWindow,
} from "./hybrid";
export { compareTotals, HybridDataSource } from "./hybrid";
export { getLitellmDataSource } from "./litellm-loader";
export { ModelProxyDataSource } from "./model-proxy";
