import type { AnalyticsDataSource } from "@lite-llm/analytics-service/data-source";
import { createDataSource } from "@lite-llm/analytics-service/data-source";
import { serverEnv } from "@lite-llm/config/server";
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
      if (serverEnv.ANALYTICS_DATA_SOURCE === "model-proxy") {
        const prisma = getModelProxyPrisma();
        await prisma.$queryRaw`SELECT 1`;
        return;
      }

      const { prisma } = await import(
        "@lite-llm/analytics-service/queries/client"
      );
      await prisma.$queryRawUnsafe("SELECT 1");
    },
  };
}
