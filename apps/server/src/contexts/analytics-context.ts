import type { AnalyticsDataSource } from "@lite-llm/analytics-service/data-source";
import { createDataSource } from "@lite-llm/analytics-service/data-source";
import { prisma } from "@lite-llm/analytics-service/queries/client";

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
