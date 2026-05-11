import { existsSync } from "node:fs";
import * as path from "node:path";
import * as process from "node:process";
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

  // Resolve special paths like @storage/agents.json, with json/jsonc fallback.
  const resolvedPath = resolveDbPathWithFallback(filePath);

  const repoOptions: RepositoryOptions = {
    filePath: resolvedPath,
    validateOnRead: false,
  };
  return createRepository(repoOptions);
}

function resolveDbPathWithFallback(dbPath: string): string {
  const resolvedPath = resolveDbPath(dbPath);
  const ext = path.extname(resolvedPath).toLowerCase();

  if (ext === ".json") {
    const jsoncPath = `${resolvedPath}c`;
    if (!existsSync(resolvedPath) && existsSync(jsoncPath)) {
      return jsoncPath;
    }
  }

  if (ext === ".jsonc") {
    const jsonPath = resolvedPath.slice(0, -1);
    if (!existsSync(resolvedPath) && existsSync(jsonPath)) {
      return jsonPath;
    }
  }

  return resolvedPath;
}

function resolveDbPath(dbPath: string): string {
  // Handle special @storage/ and @db/ paths -- resolve relative to monorepo root
  if (dbPath.startsWith("@storage/") || dbPath.startsWith("@db/")) {
    const monorepoRoot = findMonorepoRoot();
    return path.join(monorepoRoot, dbPath);
  }

  // Handle @storage/ path -- also resolve relative to monorepo root
  if (dbPath.startsWith("@storage/")) {
    const monorepoRoot = findMonorepoRoot();
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
