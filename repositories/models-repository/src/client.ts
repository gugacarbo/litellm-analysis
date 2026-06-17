import { existsSync } from "node:fs";
import * as path from "node:path";
import { serverEnv } from "@lite-llm/config/server";
import { createDbRepository } from "./db-repository";
import {
  createRepository,
  type IModelsRepository,
  type RepositoryOptions,
} from "./repository";

export type { IModelsRepository, RepositoryOptions };

export interface RepositoryClientOptions {
  modelsFilePath?: string;
}

function findMonorepoRoot(startDir: string): string {
  let dir = startDir;
  const root = path.parse(dir).root;

  while (dir !== root) {
    if (existsSync(path.join(dir, "pnpm-workspace.yaml"))) {
      return dir;
    }
    dir = path.dirname(dir);
  }

  return startDir;
}

function resolveFilePath(filePath: string): string {
  if (filePath.startsWith(`${serverEnv.SETTINGS_PATH}/`)) {
    const monorepoRoot = findMonorepoRoot(import.meta.dirname);
    return path.join(monorepoRoot, filePath);
  }

  if (path.isAbsolute(filePath)) {
    return filePath;
  }

  return path.resolve(process.cwd(), filePath);
}

function resolveModelsSettingsPath(): string {
  return `${serverEnv.SETTINGS_PATH}/models`;
}

export function createRepositoryClient(
  options: RepositoryClientOptions = {},
): IModelsRepository {
  if (serverEnv.SETTINGS_STORAGE === "database") {
    return createDbRepository({ validateOnRead: false });
  }

  const settingsBase = resolveModelsSettingsPath();
  const modelsFilePath =
    options.modelsFilePath ?? `${settingsBase}/models.jsonc`;

  let resolved = resolveFilePath(modelsFilePath);

  if (!existsSync(resolved)) {
    const jsoncPath = resolved.replace(/\.json$/, ".jsonc");
    if (existsSync(jsoncPath)) {
      resolved = jsoncPath;
    }
  }

  return createRepository({ filePath: resolved });
}
