import type {
  AgentConfig,
  AgentConfigFile,
  CategoryConfig,
  DbAgentEntry,
  DbCategoryEntry,
  DbConfig,
  DbModelSpec,
} from "../types/index.js";
import {
  getAgentAdapter,
  getCategoryAdapter,
  getStorage,
} from "./singleton.js";

// ── Public CRUD API ──

export async function readDb(): Promise<DbConfig> {
  const storage = getStorage();
  return storage.read();
}

export async function writeDb(config: DbConfig): Promise<void> {
  const storage = getStorage();
  await storage.write(config);
}

export async function readAgentConfigs(): Promise<
  Record<string, DbAgentEntry>
> {
  const db = await readDb();
  return db.agents;
}

export async function readCategoryConfigs(): Promise<
  Record<string, DbCategoryEntry>
> {
  const db = await readDb();
  return db.categories;
}

export async function readModelSpecs(): Promise<Record<string, DbModelSpec>> {
  const db = await readDb();
  return db.models;
}

export async function readConfigFile(): Promise<AgentConfigFile> {
  const db = await readDb();
  const agentTransformer = (
    await import("./singleton.js")
  ).getAgentTransformer();
  const categoryTransformer = (
    await import("./singleton.js")
  ).getCategoryTransformer();

  return {
    agents: agentTransformer.toOutput(db.agents, db.globalFallbackModel),
    categories: categoryTransformer.toOutput(
      db.categories,
      db.globalFallbackModel,
    ),
    ...(db.globalFallbackModel
      ? { globalFallbackModel: db.globalFallbackModel }
      : {}),
  };
}

export async function updateAgentInDb(
  agentKey: string,
  config: Partial<AgentConfig>,
): Promise<void> {
  const db = await readDb();
  const adapter = getAgentAdapter();
  db.agents[agentKey] = {
    ...db.agents[agentKey],
    ...adapter.toDb(config),
  };
  await writeDb(db);
}

export async function updateCategoryInDb(
  categoryKey: string,
  config: Partial<CategoryConfig>,
): Promise<void> {
  const db = await readDb();
  const adapter = getCategoryAdapter();
  db.categories[categoryKey] = {
    ...db.categories[categoryKey],
    ...adapter.toDb(config),
  };
  await writeDb(db);
}

export async function updateGlobalFallbackInDb(
  globalFallbackModel: string,
): Promise<void> {
  const db = await readDb();
  db.globalFallbackModel = globalFallbackModel;
  await writeDb(db);
}

export async function deleteAgentFromDb(agentKey: string): Promise<void> {
  const db = await readDb();
  if (agentKey in db.agents) {
    delete db.agents[agentKey];
    await writeDb(db);
  }
}

export async function deleteCategoryFromDb(categoryKey: string): Promise<void> {
  const db = await readDb();
  if (categoryKey in db.categories) {
    delete db.categories[categoryKey];
    await writeDb(db);
  }
}

export async function writeFullConfig(config: AgentConfigFile): Promise<void> {
  const db = await readDb();
  const agentAdapter = getAgentAdapter();
  const categoryAdapter = getCategoryAdapter();

  for (const [key, raw] of Object.entries(config.agents || {}) as [
    string,
    AgentConfig,
  ][]) {
    if (Object.keys(raw).length === 0) continue;
    db.agents[key] = {
      ...db.agents[key],
      ...agentAdapter.toDb(raw),
    };
  }

  for (const [key, raw] of Object.entries(config.categories || {}) as [
    string,
    CategoryConfig,
  ][]) {
    if (Object.keys(raw).length === 0) continue;
    db.categories[key] = {
      ...db.categories[key],
      ...categoryAdapter.toDb(raw),
    };
  }

  await writeDb(db);
}

// ── Aliases for backward compatibility ──

export const updateAgentInConfig = updateAgentInDb;
export const updateCategoryInConfig = updateCategoryInDb;
export const deleteAgentFromConfig = deleteAgentFromDb;
export const deleteCategoryFromConfig = deleteCategoryFromDb;
