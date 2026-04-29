import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  MONITOR_POLL_INTERVAL_MS: z.coerce.number().int().positive().default(15_000),
  DB_HOST: z.string().default("localhost"),
  DB_PORT: z.coerce.number().int().positive().default(5432),
  DB_NAME: z.string().default("litellm"),
  DB_USER: z.string().default("llmproxy"),
  DB_PASSWORD: z.string().default("dbpassword9090"),
  LITELLM_CREDENTIAL_NAME: z.string().trim().optional(),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Invalid environment variables:");
    for (const issue of result.error.issues) {
      console.error(`  ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
  }

  return result.data;
}

export const env = loadEnv();
