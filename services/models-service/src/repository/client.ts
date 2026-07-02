import {
  createRepositoryClient as createModelsRepositoryClient,
  type IModelsRepository,
  type RepositoryClientOptions,
  type RepositoryOptions,
} from "@lite-llm/models-repository";

export type {
  IModelsRepository,
  RepositoryClientOptions,
  RepositoryOptions,
};

export function createRepositoryClient(
  options: RepositoryClientOptions = {},
): IModelsRepository {
  return createModelsRepositoryClient(options);
}
