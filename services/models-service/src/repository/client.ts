import { existsSync } from "node:fs";
import * as path from "node:path";
import { serverEnv } from "@lite-llm/config/server";
import type { RepositoryOptions } from "@lite-llm/models-repository/repository";
import {
  createRepository,
  type IModelsRepository,
} from "@lite-llm/models-repository/repository";

export type { IModelsRepository, RepositoryOptions };

export interface RepositoryClientOptions {
  modelsFilePath?: string;
}

function resolveFilePath(filePath: string): string {
  const monorepoRoot = path.resolve(import.meta.dirname ?? process.cwd(), "../../..");
  
  if (filePath.startsWith("@settings/")) {
    return path.join(monorepoRoot, filePath);
  }
  
  if (path.isAbsolute(filePath)) {
    return filePath;
  }
  
  return path.resolve(process.cwd(), filePath);
}

export function createRepositoryClient(
  options: RepositoryClientOptions = {},
): IModelsRepository {
  const settingsBase = serverEnv.SETTINGS_PATH.replace("@settings", "@settings/models");
  const modelsFilePath = options.modelsFilePath ?? `${settingsBase}/models.jsonc`;
  
  let resolved = resolveFilePath(modelsFilePath);

  if (!existsSync(resolved)) {
    const jsoncPath = resolved.replace(/\.json$/, ".jsonc");
    if (existsSync(jsoncPath)) {
      resolved = jsoncPath;
    }
  }

  return createRepository({ filePath: resolved });
}
