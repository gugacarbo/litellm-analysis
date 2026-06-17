import { createRequire } from "node:module";
import type { AnalyticsDataSource } from "../types/index";

const require = createRequire(import.meta.url);

let cachedLitellmDataSource: AnalyticsDataSource | null = null;

export function getLitellmDataSource(): AnalyticsDataSource {
  if (!cachedLitellmDataSource) {
    const { DatabaseDataSource } =
      require("./database") as typeof import("./database");
    cachedLitellmDataSource = new DatabaseDataSource();
  }
  return cachedLitellmDataSource;
}
