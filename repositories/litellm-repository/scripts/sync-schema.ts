import { execSync } from "node:child_process";
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = resolve(__dirname, "..");
const prismaDir = resolve(rootDir, "prisma");
const migrationsDir = resolve(prismaDir, "migrations");
const schemaPath = resolve(prismaDir, "schema.prisma");

const LITELLM_REPO = "https://github.com/BerriAI/litellm.git";
const UPSTREAM_PRISMA_DIR = "litellm-proxy-extras/litellm_proxy_extras";

function fetchUpstream(): string {
  const tmpDir = resolve(rootDir, ".tmp-litellm-upstream");

  if (existsSync(tmpDir)) {
    rmSync(tmpDir, { recursive: true });
  }

  console.log(`Cloning upstream ${LITELLM_REPO}...`);
  execSync(
    `git clone --depth 1 --filter=blob:none --sparse ${LITELLM_REPO} ${tmpDir}`,
    { stdio: "inherit", timeout: 180_000 },
  );

  console.log("Sparse-checkout migrations + schema.prisma...");
  // schema.prisma is a file, not a directory — use --skip-checks
  execSync(
    `git -C ${tmpDir} sparse-checkout set --skip-checks ${UPSTREAM_PRISMA_DIR}/migrations ${UPSTREAM_PRISMA_DIR}/schema.prisma`,
    { stdio: "inherit" },
  );
  // sparse-checkout doesn't check out blobs by default with --filter=blob:none
  execSync(`git -C ${tmpDir} checkout`, { stdio: "inherit" });

  return tmpDir;
}

function transformSchema(upstreamSchema: string): string {
  // Replace the upstream prisma-client-py generator with prisma-client-js
  // Keep the datasource block as-is for migration compatibility
  return upstreamSchema.replace(
    /generator client \{[\s\S]*?\}/,
    `generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"
}`,
  );
}

function main() {
  // 1. Reset local prisma assets (keep directory, remove old content)
  if (existsSync(migrationsDir)) {
    rmSync(migrationsDir, { recursive: true });
  }
  if (existsSync(schemaPath)) {
    rmSync(schemaPath);
  }
  mkdirSync(migrationsDir, { recursive: true });

  // 2. Fetch upstream LiteLLM schema + migrations via sparse git clone
  const tmpDir = fetchUpstream();

  // 3. Transform and write schema.prisma
  console.log(
    "Transforming schema.prisma (prisma-client-py -> prisma-client-js)...",
  );
  const upstreamSchema = readFileSync(
    join(tmpDir, UPSTREAM_PRISMA_DIR, "schema.prisma"),
    "utf-8",
  );
  const transformedSchema = transformSchema(upstreamSchema);
  writeFileSync(schemaPath, transformedSchema, "utf-8");
  console.log(`Schema written to ${schemaPath}`);

  // 4. Copy upstream migrations
  const upstreamMigrationsDir = join(tmpDir, UPSTREAM_PRISMA_DIR, "migrations");
  const migrationNames = execSync(`ls -1 ${upstreamMigrationsDir}`, {
    encoding: "utf-8",
  })
    .trim()
    .split("\n");

  cpSync(upstreamMigrationsDir, migrationsDir, { recursive: true });
  console.log(`Copied ${migrationNames.length} migrations from upstream.`);

  // 5. Regenerate Prisma client
  console.log("Generating Prisma client...");
  execSync("npx prisma generate", {
    cwd: rootDir,
    stdio: "inherit",
  });
  console.log("Prisma client regenerated.");

  // 6. Cleanup temp directory
  rmSync(tmpDir, { recursive: true });

  console.log(
    `\nSync complete! ${migrationNames.length} migrations synced from upstream.`,
  );
}

main();
