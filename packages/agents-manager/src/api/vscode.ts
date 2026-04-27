import { createVscodeModelsGenerator } from "../generators/index.js";
import { persistAvailableModelsToDb } from "./model-persistence.js";
import { getStorage } from "./singleton.js";

export async function writeVscodeModelsFile(
  dbModels?: Array<{
    modelName: string;
    litellmParams: Record<string, unknown> | null;
  }>,
): Promise<void> {
  await persistAvailableModelsToDb(dbModels);

  const storage = getStorage();
  const paths = storage.getPaths();
  const generator = createVscodeModelsGenerator(paths.vscodeModelsFile);
  await generator.write(dbModels);
}
