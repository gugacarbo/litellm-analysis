import { createEnv } from "@t3-oss/env-core";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: ["../../.env.local", "../../.env"] });

export const serverSchema = {
  PORT: z.coerce.number().int().positive(),

  DB_HOST: z.string(),
  DB_PORT: z.coerce.number().int().positive(),
  DB_NAME: z.string(),
  DB_USER: z.string(),
  DB_PASSWORD: z.string().min(1, "DB_PASSWORD is required"),

  LITELLM_API_URL: z.url(),
  LITELLM_API_KEY: z.string().min(1, "LITELLM_API_KEY is required"),

  HEALTH_CHECK_INTERVAL_MS: z.coerce.number().int().positive(),
  HEALTH_CHECK_TIMEOUT_MS: z.coerce.number().int().positive(),

  APP_DB_PATH: z.string(),
  SETTINGS_PATH: z.string().default("@settings"),
};

export const serverEnv = createEnv({
  server: serverSchema,
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export type ServerEnv = typeof serverEnv;
