import type { AnalyticsDataSource } from "../types/index";
import { ModelProxyDataSource } from "./model-proxy";

export function createDataSource(): AnalyticsDataSource {
  return new ModelProxyDataSource();
}

export type { AnalyticsDataSource } from "../types/index";
