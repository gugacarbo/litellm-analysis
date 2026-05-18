import * as path from "node:path";
import { fileURLToPath } from "node:url";

import { defineConfig } from "drizzle-kit";

const PACKAGE_ROOT = path.dirname(fileURLToPath(import.meta.url));
const MONOREPO_ROOT = path.resolve(PACKAGE_ROOT, "../..");
const APP_DB_PATH = process.env.APP_DB_PATH ?? "@storage/app.db";

export default defineConfig({
  schema: "./src/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: path.resolve(MONOREPO_ROOT, APP_DB_PATH),
  },
});
