import { createDbRepository } from "./db-repository";
import type { IModelsRepository } from "./repository";

export type { IModelsRepository };

export interface RepositoryClientOptions {
  modelsFilePath?: string;
}

export function createRepositoryClient(
  _options: RepositoryClientOptions = {},
): IModelsRepository {
  return createDbRepository({ validateOnRead: false });
}
