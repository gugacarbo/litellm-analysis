import {
  createRepositoryClient as createModelsRepositoryClient,
  type IModelsRepository,
  type RepositoryOptions,
} from "@lite-llm/models-repository";

export type { IModelsRepository, RepositoryOptions };

export interface RepositoryClientOptions {
  modelsFilePath?: string;
}

export function createRepositoryClient(
  options: RepositoryClientOptions = {},
): IModelsRepository {
  return createModelsRepositoryClient({
    modelsFilePath: options.modelsFilePath,
  });
}
