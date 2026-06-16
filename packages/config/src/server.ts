import { resolve } from "node:path";
import { createEnv } from "@t3-oss/env-core";
import dotenv from "dotenv";
import { z } from "zod";

const packageRoot = resolve(import.meta.dirname, "..");
const repoRoot = resolve(packageRoot, "..", "..");

dotenv.config({
  path: [resolve(repoRoot, ".env.local"), resolve(repoRoot, ".env")],
});

export const serverSchema = {
  PORT: z.coerce.number().int().positive(),

  DB_HOST: z.string(),
  DB_PORT: z.coerce.number().int().positive(),
  DB_NAME: z.string(),
  DB_USER: z.string(),
  DB_PASSWORD: z.string().min(1, "DB_PASSWORD is required"),

  MODEL_PROXY_API_KEY: z
    .string()
    .min(1, "MODEL_PROXY_API_KEY cannot be empty")
    .optional(),
  MODEL_PROXY_DATABASE_URL: z
    .string()
    .min(1, "MODEL_PROXY_DATABASE_URL cannot be empty")
    .optional(),
  MODEL_PROXY_BASE_URL: z.url().optional(),
  MODEL_PROXY_UPSTREAM_BASE_URL: z.url().optional(),
  MODEL_PROXY_UPSTREAM_API_KEY: z
    .string()
    .min(1, "MODEL_PROXY_UPSTREAM_API_KEY cannot be empty")
    .optional(),

  HEALTH_CHECK_INTERVAL_MS: z.coerce.number().int().positive(),
  HEALTH_CHECK_TIMEOUT_MS: z.coerce.number().int().positive(),

  APP_DB_PATH: z.string(),
  STORAGE_PATH: z.string().default("@storage"),
  SETTINGS_PATH: z.string().default("@settings"),
};

export const serverEnv = createEnv({
  server: serverSchema,
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

const backupDbSchema = z.object({
  DB_HOST: z.string().min(1, "DB_HOST is required"),
  DB_PORT: z.coerce.number().int().positive(),
  DB_NAME: z.string().min(1, "DB_NAME is required"),
  DB_USER: z.string().min(1, "DB_USER is required"),
  DB_PASSWORD: z.string().min(1, "DB_PASSWORD is required"),
});

export function getBackupDatabaseUrlFromEnv(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const env = backupDbSchema.parse(process.env);
  const user = encodeURIComponent(env.DB_USER);
  const password = encodeURIComponent(env.DB_PASSWORD);
  const dbName = encodeURIComponent(env.DB_NAME);

  return `postgresql://${user}:${password}@${env.DB_HOST}:${env.DB_PORT}/${dbName}`;
}

export type ServerEnv = typeof serverEnv;
