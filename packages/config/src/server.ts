import { resolve } from "node:path";
import { createEnv } from "@t3-oss/env-core";
import dotenv from "dotenv";
import { z } from "zod";

const packageRoot = resolve(import.meta.dirname, "..");
const repoRoot = resolve(packageRoot, "..", "..");

dotenv.config({
  path: [resolve(repoRoot, ".env.local"), resolve(repoRoot, ".env")],
});

const serverSchema = {
  APP_ENCRYPTION_KEY: z
    .string()
    .min(1, "APP_ENCRYPTION_KEY cannot be empty!")
    .optional(),

  PORT: z.coerce.number().int().positive(),
  DATABASE_URL: z.url().min(1, "DATABASE_URL cannot be empty"),

  MODEL_PROXY_API_KEY: z
    .string()
    .min(1, "MODEL_PROXY_API_KEY cannot be empty")
    .optional(),
  MODEL_PROXY_BASE_URL: z.url().optional(),
  STORAGE_PATH: z.string().default("@storage"),
};

export const serverEnv = createEnv({
  server: serverSchema,
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
