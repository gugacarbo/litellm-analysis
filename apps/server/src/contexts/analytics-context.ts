import type { AnalyticsDataSource } from "@lite-llm/analytics/data-source";
import { createDataSource } from "@lite-llm/analytics/data-source";
import { prisma } from "@lite-llm/analytics/queries/client";

export interface AnalyticsProvider {
  dataSource: AnalyticsDataSource;
  checkReadiness(): Promise<void>;
}

export function createAnalyticsProvider(): AnalyticsProvider {
  const dataSource = createDataSource();
  return {
    dataSource,
    async checkReadiness() {
      await prisma.$queryRawUnsafe("SELECT 1");
    },
  };
}
