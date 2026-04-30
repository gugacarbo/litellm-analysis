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
};

export const serverEnv = createEnv({
  server: serverSchema,
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});

export type ServerEnv = typeof serverEnv;
