import { existsSync } from "node:fs";
import * as path from "node:path";
import * as process from "node:process";
import { migrateV1ToV2 } from "../migration/index.js";
import type { MigrationResult } from "../migration/index.js";
import {
  createRepository,
  type IAgentsRepository,
  type RepositoryOptions,
} from "@lite-llm/agents-repository/repository";
import { DEFAULT_DB_PATH } from "../config/defaults.js";

export interface RepositoryClientOptions {
  filePath?: string;
}

export function createRepositoryClient(
  options: RepositoryClientOptions = {},
): IAgentsRepository {
  const filePath = options.filePath ?? DEFAULT_DB_PATH;

  // Resolve special paths like @settings/agents.json
  const resolvedPath = resolveDbPath(filePath);

  const repoOptions: RepositoryOptions = {
    filePath: resolvedPath,
    validateOnRead: true,
  };
  return createRepository(repoOptions);
}

/**
 * Read and auto-migrate the agent config.
 * Uses the v1->v2 migration to ensure the returned config always has
 * `systemAgents` and `routing` fields, even when the stored file is
 * in the legacy v1 format.
 *
 * NOTE: Does NOT auto-write the migrated config back to disk, because
 * the current schema validation on write does not yet include the new
 * fields. Write-back will be enabled when the schema is updated.
 */
export async function readMigratedConfig(
  repo: IAgentsRepository,
): Promise<MigrationResult["config"]> {
  const config = await repo.read();
  const result = migrateV1ToV2(config);
  return result.config;
}

export function readMigratedConfigSync(
  repo: IAgentsRepository,
): MigrationResult["config"] {
  const config = repo.readSync();
  const result = migrateV1ToV2(config);
  return result.config;
}

function resolveDbPath(dbPath: string): string {
  // Handle special @db/ paths -- resolve relative to monorepo root
  if (dbPath.startsWith("@settings/")) {
    const monorepoRoot = findMonorepoRoot();
    // @settings/agents.json stays as-is since @settings is the actual directory name
    return path.join(monorepoRoot, dbPath);
  }

  // Handle absolute paths
  if (path.isAbsolute(dbPath)) {
    return dbPath;
  }

  // Handle relative paths -- resolve from current working directory
  return path.resolve(process.cwd(), dbPath);
}

function findMonorepoRoot(): string {
  // Walk up from current directory to find pnpm-workspace.yaml
  // (monorepo root marker). If not found, fall back to findProjectRoot.
  let dir = process.cwd();
  const root = path.parse(dir).root;

  while (dir !== root) {
    const workspacePath = path.join(dir, "pnpm-workspace.yaml");
    if (existsSync(workspacePath)) {
      return dir;
    }

    dir = path.dirname(dir);
  }

  // Fallback: find closest package.json
  return findProjectRoot();
}

function findProjectRoot(): string {
  let dir = process.cwd();
  const root = path.parse(dir).root;

  while (dir !== root) {
    const pkgPath = path.join(dir, "package.json");
    if (existsSync(pkgPath)) {
      return dir;
    }

    dir = path.dirname(dir);
  }

  return process.cwd();
}
