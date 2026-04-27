import { createProvidersGenerator } from "../generators/index.js";
import { getStorage } from "./singleton.js";
import { persistAvailableModelsToDb } from "./model-persistence.js";

export async function writeProvidersFile(
  config?: unknown,
  dbModels?: Array<{
    modelName: string;
    litellmParams: Record<string, unknown> | null;
  }>,
): Promise<void> {
  await persistAvailableModelsToDb(dbModels);

  const storage = getStorage();
  const paths = storage.getPaths();
  const generator = createProvidersGenerator(paths.providersFile);
  await generator.write(config, dbModels);
}
