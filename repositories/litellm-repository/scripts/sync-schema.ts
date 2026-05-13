import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const schemaPath = resolve(rootDir, "prisma", "schema.prisma");

const CUSTOM_HEADER = `datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"
}
`;

function main() {
  console.log("Introspecting live LiteLLM database...");

  const rawOutput = execSync("npx prisma db pull --force --print", {
    cwd: rootDir,
    encoding: "utf-8",
  });

  const modelsSection = rawOutput
    .replace(/^datasource\s+\w+\s*\{[^}]*\}/ms, "")
    .replace(/^generator\s+\w+\s*\{[^}]*\}/ms, "")
    .trim();

  const fullSchema = `${CUSTOM_HEADER}\n${modelsSection}\n`;

  writeFileSync(schemaPath, fullSchema, "utf-8");
  console.log("Schema updated from live database.");

  console.log("Regenerating Prisma client...");
  execSync("npx prisma generate", {
    cwd: rootDir,
    stdio: "inherit",
  });
  console.log("Prisma client regenerated.");

  console.log("Sync complete!");
}

main();
