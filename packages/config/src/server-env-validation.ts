export type AnalyticsDataSourceEnv = {
  DATABASE_URL?: string;
};

export function assertAnalyticsDataSourceEnv(
  env: AnalyticsDataSourceEnv,
): void {
  if (!env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required");
  }
}
