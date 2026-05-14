import type { AnalyticsDataSource } from "../types/index";

import { DatabaseDataSource } from "./database";

export function createDataSource(): AnalyticsDataSource {
  return new DatabaseDataSource();
}

export type { AnalyticsDataSource } from "../types/index";
export { DatabaseDataSource };
