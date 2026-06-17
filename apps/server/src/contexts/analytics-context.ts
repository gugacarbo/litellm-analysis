import type { AnalyticsDataSource } from "@lite-llm/analytics-service/data-source";
import { createDataSource } from "@lite-llm/analytics-service/data-source";
import { getModelProxyPrisma } from "@lite-llm/model-proxy-repository";

export interface AnalyticsProvider {
  dataSource: AnalyticsDataSource;
  checkReadiness(): Promise<void>;
}

export function createAnalyticsProvider(): AnalyticsProvider {
  const dataSource = createDataSource();
  return {
    dataSource,
    async checkReadiness() {
      const prisma = getModelProxyPrisma();
      await prisma.$queryRaw`SELECT 1`;
    },
  };
}
