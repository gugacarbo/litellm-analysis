import { createEnv } from "@t3-oss/env-core";
import dotenv from "dotenv";
import { z } from "zod";

dotenv.config({ path: ["../../.env.local", "../../.env"] });

export const serverSchema = {
  PORT: z.coerce.number().int().positive().default(3000),
  MONITOR_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(15_000),
  DB_HOST: z.string().default("localhost"),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_NAME: z.string().default("litellm"),
  DB_USER: z.string().default("llmproxy"),

  DB_PASSWORD: z.string().default("dbpassword9090"),
  LITELLM_CREDENTIAL_NAME: z.string().trim().optional(),
  LITELLM_API_URL: z.string().url().default("http://localhost:4000"),
  LITELLM_API_KEY: z.string().default(""),
  HEALTH_CHECK_INTERVAL_MS: z.coerce.number().int().positive().default(120_000),
  HEALTH_CHECK_TIMEOUT_MS: z.coerce.number().int().positive().default(15_000),
  HEALTH_CHECK_PROMPT: z
    .string()
    .default(
      "Respond with ONLY your model name. Example: gpt-5.3-codex",
    ),
};

export const serverEnv = createEnv({
  server: serverSchema,
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export type ServerEnv = typeof serverEnv;
