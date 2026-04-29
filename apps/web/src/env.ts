import { z } from "zod";

const envSchema = z.object({
  VITE_APP_LOCALE: z.string().trim().optional(),
  VITE_LITELLM_API_URL: z.string().url().optional(),
  VITE_LITELLM_API_KEY: z.string().trim().optional(),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const result = envSchema.safeParse(import.meta.env);

  if (!result.success) {
    console.error("❌ Invalid environment variables:");
    for (const issue of result.error.issues) {
      console.error(`  ${issue.path.join(".")}: ${issue.message}`);
    }
    throw new Error("Invalid environment variables");
  }

  return result.data;
}

export const env = loadEnv();
