import { existsSync } from "node:fs";
import * as path from "node:path";
import * as process from "node:process";
import { createRepository } from "@lite-llm/agents-repository/repository";
import { DEFAULT_DB_PATH } from "../config/defaults.js";
export function createRepositoryClient(options = {}) {
  const filePath = options.filePath ?? DEFAULT_DB_PATH;
  // Resolve special paths like @settings/agents.json
  const resolvedPath = resolveDbPath(filePath);
  const repoOptions = {
    filePath: resolvedPath,
    validateOnRead: true,
  };
  return createRepository(repoOptions);
}
function resolveDbPath(dbPath) {
  // Handle special @db/ paths — resolve relative to monorepo root
  if (dbPath.startsWith("@settings/")) {
    const monorepoRoot = findMonorepoRoot();
    // @settings/agents.json stays as-is since @settings is the actual directory name
    return path.join(monorepoRoot, dbPath);
  }
  // Handle absolute paths
  if (path.isAbsolute(dbPath)) {
    return dbPath;
  }
  // Handle relative paths — resolve from current working directory
  return path.resolve(process.cwd(), dbPath);
}
function findMonorepoRoot() {
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
function findProjectRoot() {
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
