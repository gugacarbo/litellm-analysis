import { existsSync } from "node:fs";
import * as path from "node:path";
import type { RepositoryOptions } from "@lite-llm/models-repository/repository";
import {
  createRepository,
  type IModelsRepository,
} from "@lite-llm/models-repository/repository";

export type { IModelsRepository, RepositoryOptions };

export interface RepositoryClientOptions {
  filePath?: string;
}

const DEFAULT_FILE_PATH = "@settings/models/models.jsonc";

function resolveFilePath(filePath: string): string {
  if (filePath.startsWith("@settings/models/")) {
    const rest = filePath.slice("@settings/models/".length);
    const base = path.resolve(import.meta.dirname ?? process.cwd(), "../../..");
    return path.join(base, "@settings/models", rest);
  }
  return filePath;
}

export function createRepositoryClient(
  options: RepositoryClientOptions = {},
): IModelsRepository {
  const rawPath = options.filePath ?? DEFAULT_FILE_PATH;
  let resolved = resolveFilePath(rawPath);

  if (!existsSync(resolved)) {
    const jsoncPath = resolved.replace(/\.json$/, ".jsonc");
    if (existsSync(jsoncPath)) {
      resolved = jsoncPath;
    }
  }

  return createRepository({ filePath: resolved });
}
