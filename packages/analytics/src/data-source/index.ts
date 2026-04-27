import type { AnalyticsDataSource } from "../types/index.js";

import { DatabaseDataSource } from "./database.js";

export function createDataSource(): AnalyticsDataSource {
  return new DatabaseDataSource();
}

export type { AnalyticsDataSource } from "../types/index.js";
export { DatabaseDataSource };
