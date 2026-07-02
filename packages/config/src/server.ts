import { resolve } from "node:path";
import { createEnv } from "@t3-oss/env-core";
import dotenv from "dotenv";
import { z } from "zod";
import { assertAnalyticsDataSourceEnv, type AnalyticsDataSourceEnv } from "./server-env-validation";

export type { AnalyticsDataSourceEnv } from "./server-env-validation";
export { assertAnalyticsDataSourceEnv } from "./server-env-validation";

const packageRoot = resolve(import.meta.dirname, "..");
const repoRoot = resolve(packageRoot, "..", "..");

dotenv.config({
  path: [resolve(repoRoot, ".env.local"), resolve(repoRoot, ".env")],
});

export const serverSchema = {
  PORT: z.coerce.number().int().positive(),

  MODEL_PROXY_API_KEY: z
    .string()
    .min(1, "MODEL_PROXY_API_KEY cannot be empty")
    .optional(),
  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL cannot be empty")
    .optional(),
  MODEL_PROXY_BASE_URL: z.url().optional(),
  MODEL_PROXY_UPSTREAM_BASE_URL: z.url().optional(),
  MODEL_PROXY_UPSTREAM_API_KEY: z
    .string()
    .min(1, "MODEL_PROXY_UPSTREAM_API_KEY cannot be empty")
    .optional(),
  MODEL_PROXY_OAUTH_ENCRYPTION_KEY: z
    .string()
    .min(1, "MODEL_PROXY_OAUTH_ENCRYPTION_KEY cannot be empty")
    .optional(),

  HEALTH_CHECK_INTERVAL_MS: z.coerce.number().int().positive(),
  HEALTH_CHECK_TIMEOUT_MS: z.coerce.number().int().positive(),

  STORAGE_PATH: z.string().default("@storage"),
};

export const serverEnv = createEnv({
  server: serverSchema,
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

assertAnalyticsDataSourceEnv(serverEnv as AnalyticsDataSourceEnv);

export function getBackupDatabaseUrlFromEnv(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required for database backup");
  }
  return url;
}

export type ServerEnv = typeof serverEnv;
