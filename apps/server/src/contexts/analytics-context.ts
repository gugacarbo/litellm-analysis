import type { AnalyticsDataSource } from "@lite-llm/analytics-service/data-source";
import { createDataSource } from "@lite-llm/analytics-service/data-source";
import { queryRaw } from "@lite-llm/database/client";
import { sql } from "drizzle-orm";

export interface AnalyticsProvider {
  dataSource: AnalyticsDataSource;
  checkReadiness(): Promise<void>;
}

export function createAnalyticsProvider(): AnalyticsProvider {
  const dataSource = createDataSource();
  return {
    dataSource,
    async checkReadiness() {
      await queryRaw(sql`SELECT 1`, []);
    },
  };
}
