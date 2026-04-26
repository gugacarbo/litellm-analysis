import { createVscodeModelsGenerator } from "../generators/index.js";
import { getStorage } from "./singleton.js";

export async function writeVscodeModelsFile(
  dbModels?: Array<{
    modelName: string;
    litellmParams: Record<string, unknown> | null;
  }>,
): Promise<void> {
  const storage = getStorage();
  const paths = storage.getPaths();
  const generator = createVscodeModelsGenerator(paths.vscodeModelsFile);
  await generator.write(dbModels);
}
