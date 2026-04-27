import { mergeModelsFromDb } from "../generators/providers/merger.js";
import { readDb, writeDb } from "./crud.js";

interface DbModelWithParams {
  modelName: string;
  litellmParams: Record<string, unknown> | null;
}

export async function persistAvailableModelsToDb(
  dbModels?: DbModelWithParams[],
): Promise<void> {
  if (!dbModels || dbModels.length === 0) {
    return;
  }

  const db = await readDb();
  const mergedModels = mergeModelsFromDb(db.models, dbModels);
  db.models = mergedModels;
  await writeDb(db);
}
