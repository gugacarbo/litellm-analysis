import { asc, eq, sql } from "drizzle-orm";
import { db } from "../client";
import { proxyModelTable, spendLogs } from "../schema";

export async function getModelDetails() {
  const result = await db
    .select({
      model_name: proxyModelTable.modelName,
      input_cost_per_token: sql`${proxyModelTable.litellmParams}->>'input_cost_per_token'`,
      output_cost_per_token: sql`${proxyModelTable.litellmParams}->>'output_cost_per_token'`,
    })
    .from(proxyModelTable);
  return result;
}

export async function getAllModels() {
  const result = await db
    .select({
      modelName: proxyModelTable.modelName,
      litellmParams: proxyModelTable.litellmParams,
    })
    .from(proxyModelTable)
    .orderBy(asc(proxyModelTable.modelName));
  return result;
}

export async function getModelByName(modelName: string) {
  const result = await db
    .select({
      modelName: proxyModelTable.modelName,
      litellmParams: proxyModelTable.litellmParams,
    })
    .from(proxyModelTable)
    .where(eq(proxyModelTable.modelName, modelName))
    .limit(1);
  return result[0] || null;
}

export async function createModel(model: {
  modelName: string;
  litellmParams: Record<string, unknown>;
}) {
  await db.insert(proxyModelTable).values({
    modelName: model.modelName,
    litellmParams: model.litellmParams,
  });
}

export async function updateModel(
  modelName: string,
  updates: { litellmParams?: Record<string, unknown>; modelName?: string },
) {
  await db
    .update(proxyModelTable)
    .set(updates)
    .where(eq(proxyModelTable.modelName, modelName));
}

export async function deleteModel(modelName: string) {
  await db
    .delete(proxyModelTable)
    .where(eq(proxyModelTable.modelName, modelName));
}

export async function mergeModels(sourceModel: string, targetModel: string) {
  await db
    .update(spendLogs)
    .set({ model: targetModel })
    .where(eq(spendLogs.model, sourceModel));
}

export async function deleteModelLogs(modelName: string) {
  if (modelName.trim() === "") {
    await db
      .delete(spendLogs)
      .where(sql`NULLIF(BTRIM(${spendLogs.model}), '') IS NULL`);
    return;
  }

  await db.delete(spendLogs).where(eq(spendLogs.model, modelName));
}
