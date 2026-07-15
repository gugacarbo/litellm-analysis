import { defineConfig } from "drizzle-kit";

/**
 * Baseline migration used only by `pnpm db:migrate --fresh`.
 * It represents the current clean schema, independently from legacy history.
 */
export default defineConfig({
  schema: "./src/schema/index.ts",
  out: "./drizzle-fresh",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
