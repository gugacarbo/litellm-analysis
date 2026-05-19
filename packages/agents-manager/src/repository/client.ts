import { copyFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import * as path from "node:path";
import * as process from "node:process";
import {
  createRepository,
  type IAgentsRepository,
  type RepositoryOptions,
} from "@lite-llm/agents-repository/repository";
import { serverEnv } from "@lite-llm/config/server";

export interface RepositoryClientOptions {
  agentsFilePath?: string;
  pluginsFilePath?: string;
}

export function createRepositoryClient(
  options: RepositoryClientOptions = {},
): IAgentsRepository {
  const agentsSettingsBase = `${serverEnv.SETTINGS_PATH}/agents`;
  const pluginsSettingsBase = `${serverEnv.SETTINGS_PATH}/plugins`;
  const agentsFilePath =
    options.agentsFilePath ?? `${agentsSettingsBase}/agents.jsonc`;
  const pluginsFilePath =
    options.pluginsFilePath ?? `${pluginsSettingsBase}/plugins.json`;

  // Resolve special paths like @settings/agents/, with json/jsonc fallback.
  const resolvedPath = resolveDbPathWithFallback(agentsFilePath);
  const resolvedPluginsPath = resolveDbPathWithFallback(pluginsFilePath);

  ensureConfigFileExists(resolvedPath);
  ensurePluginsFileExists(resolvedPluginsPath);

  const repoOptions: RepositoryOptions = {
    filePath: resolvedPath,
    pluginsFilePath: resolvedPluginsPath,
    validateOnRead: false,
  };
  return createRepository(repoOptions);
}

function ensureConfigFileExists(targetPath: string): void {
  if (existsSync(targetPath)) return;

  const ext = path.extname(targetPath).toLowerCase();
  const defaultPath =
    ext === ".jsonc"
      ? targetPath.replace(/\.jsonc$/i, ".default.json")
      : targetPath.replace(/\.json$/i, ".default.json");

  if (!existsSync(defaultPath)) return;

  mkdirSync(path.dirname(targetPath), { recursive: true });
  copyFileSync(defaultPath, targetPath);
}

function ensurePluginsFileExists(targetPath: string): void {
  if (existsSync(targetPath)) return;

  const ext = path.extname(targetPath).toLowerCase();
  const defaultPath =
    ext === ".jsonc"
      ? targetPath.replace(/\.jsonc$/i, ".default.json")
      : targetPath.replace(/\.json$/i, ".default.json");

  if (existsSync(defaultPath)) {
    mkdirSync(path.dirname(targetPath), { recursive: true });
    copyFileSync(defaultPath, targetPath);
    return;
  }

  // No default file — create minimal plugins config
  mkdirSync(path.dirname(targetPath), { recursive: true });
  const minimalPlugins = {
    $schema: "./plugins.schema.json",
    version: 2,
    plugins: {},
  };
  writeFileSync(targetPath, JSON.stringify(minimalPlugins, null, 2), "utf-8");
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
  if (dbPath.startsWith(`${serverEnv.SETTINGS_PATH}/`)) {
    const monorepoRoot = findMonorepoRoot();
    return path.join(monorepoRoot, dbPath);
  }

  if (path.isAbsolute(dbPath)) {
    return dbPath;
  }

  return path.resolve(process.cwd(), dbPath);
}

function findMonorepoRoot(): string {
  let dir = process.cwd();
  const root = path.parse(dir).root;

  while (dir !== root) {
    const workspacePath = path.join(dir, "pnpm-workspace.yaml");
    if (existsSync(workspacePath)) {
      return dir;
    }

    dir = path.dirname(dir);
  }

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
