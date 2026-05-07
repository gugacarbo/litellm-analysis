import { createDataSource } from "@lite-llm/analytics/data-source";
import { litellmDb } from "@lite-llm/analytics/queries/client";
import { sql } from "drizzle-orm";
export function createAnalyticsProvider() {
  const dataSource = createDataSource();
  return {
    dataSource,
    async checkReadiness() {
      await litellmDb.execute(sql`SELECT 1`);
    },
  };
}
