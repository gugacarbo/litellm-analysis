import type { ModelsConfig } from "./schemas/index.js";

export interface IModelsRepository {
  read(): Promise<ModelsConfig>;
  readSync(): ModelsConfig;
  write(config: ModelsConfig): Promise<void>;
  validate(config: unknown): config is ModelsConfig;
  exists(): Promise<boolean>;
  getPath(): string;
}
