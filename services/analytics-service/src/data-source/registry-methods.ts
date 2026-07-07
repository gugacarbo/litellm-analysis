import crypto from "node:crypto";
import { db } from "@lite-llm/database/client";
import {
  modelProxyModels,
  modelProxyProviders,
  modelProxySettings,
} from "@lite-llm/database/schema/model-proxy";
import { fromModelProxyRow, toModelRoute } from "@lite-llm/llm-config-service";
import { asc, eq } from "drizzle-orm";
import type { ModelDetail, ModelEntry, RegistryProvider } from "../types/index";
import type { ModelRoute } from "@lite-llm/llm-config-service";

const DEFAULT_PROVIDER_KEY = "default_provider";
const HEALTH_CHECK_PROMPT_KEY = "health_check_prompt";

function dbModelToRoute(row: typeof modelProxyModels.$inferSelect) {
  return fromModelProxyRow({
    id: row.id,
    modelName: row.modelName,
    enabled: row.enabled,
    displayName: row.displayName,
    family: row.family,
    ownedBy: row.ownedBy,
    apiMode: row.apiMode,
    vision: row.vision,
    contextWindowSize: row.contextWindowSize,
    maxOutputTokens: row.maxOutputTokens,
    inputCostPerToken: row.inputCostPerToken,
    outputCostPerToken: row.outputCostPerToken,
    upstreamModel: row.upstreamModel,
    upstreamBaseUrl: row.upstreamBaseUrl,
    providerName: row.providerName,
    secretRef: row.secretRef,
    requestOptions:
      row.requestOptions === null
        ? null
        : (row.requestOptions as Record<string, unknown>),
    metadata:
      row.metadata === null ? null : (row.metadata as Record<string, unknown>),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}

function routeToCreateData(route: ReturnType<typeof dbModelToRoute>) {
  return {
    modelName: route.modelName,
    enabled: route.enabled ?? true,
    displayName: route.displayName,
    family: route.family,
    ownedBy: route.ownedBy,
    apiMode: route.apiMode,
    vision: route.vision,
    contextWindowSize: route.contextWindowSize,
    maxOutputTokens: route.maxOutputTokens,
    inputCostPerToken: route.inputCostPerToken,
    outputCostPerToken: route.outputCostPerToken,
    upstreamModel: route.upstreamModel ?? route.modelName,
    upstreamBaseUrl: route.upstreamBaseUrl ?? "",
    providerName: route.providerName,
    secretRef: route.secretRef,
    requestOptions:
      route.requestOptions !== undefined
        ? (route.requestOptions as Record<string, unknown>)
        : undefined,
    metadata:
      route.metadata !== undefined
        ? (route.metadata as Record<string, unknown>)
        : undefined,
  };
}

export async function getRegistryModelsImpl(): Promise<ModelEntry[]> {
  const rows = await db
    .select()
    .from(modelProxyModels)
    .orderBy(asc(modelProxyModels.modelName));
  return rows.map((row) => ({
    modelName: row.modelName,
    modelRoute: dbModelToRoute(row),
  }));
}

export async function getRegistryModelDetailsImpl(): Promise<ModelDetail[]> {
  const rows = await db
    .select()
    .from(modelProxyModels)
    .orderBy(asc(modelProxyModels.modelName));
  return rows.map((row) => ({
    model_name: row.modelName,
    input_cost_per_token:
      row.inputCostPerToken != null ? String(row.inputCostPerToken) : null,
    output_cost_per_token:
      row.outputCostPerToken != null ? String(row.outputCostPerToken) : null,
  }));
}

export async function createRegistryModelImpl(model: {
  modelName: string;
  modelRoute?: ModelRoute;
}): Promise<void> {
  let route: ReturnType<typeof dbModelToRoute>;
  if (model.modelRoute) {
    const { modelName: _rn, ...rest } = model.modelRoute;
    route = {
      ...rest,
      modelName: model.modelName,
    } as ReturnType<typeof dbModelToRoute>;
  } else {
    route = toModelRoute({}, model.modelName);
  }
  await db.insert(modelProxyModels).values(routeToCreateData(route));
}

export async function updateRegistryModelImpl(
  modelName: string,
  updates: {
    modelRoute?: ModelRoute;
    modelName?: string;
  },
): Promise<void> {
  const targetName = updates.modelName ?? modelName;
  let route: ReturnType<typeof dbModelToRoute> | null = null;
  if (updates.modelRoute) {
    const { modelName: _rn, ...rest } = updates.modelRoute;
    route = {
      ...rest,
      modelName: targetName,
    } as ReturnType<typeof dbModelToRoute>;
  }

  if (targetName !== modelName) {
    const [existing] = await db
      .select()
      .from(modelProxyModels)
      .where(eq(modelProxyModels.modelName, modelName))
      .limit(1);
    if (!existing) {
      throw new Error(`Model "${modelName}" not found`);
    }
    const existingRoute = dbModelToRoute(existing);
    const mergedRoute = route ?? existingRoute;
    const { modelName: _mn, ...mergedRest } = mergedRoute;
    await db
      .delete(modelProxyModels)
      .where(eq(modelProxyModels.id, existing.id));
    await db
      .insert(modelProxyModels)
      .values(routeToCreateData({ ...mergedRest, modelName: targetName }));
    return;
  }

  if (!route) {
    return;
  }

  const [existing] = await db
    .select()
    .from(modelProxyModels)
    .where(eq(modelProxyModels.modelName, modelName))
    .limit(1);
  if (!existing) {
    throw new Error(`Model "${modelName}" not found`);
  }
  await db
    .update(modelProxyModels)
    .set(routeToCreateData(route))
    .where(eq(modelProxyModels.id, existing.id));
}

export async function deleteRegistryModelImpl(
  modelName: string,
): Promise<void> {
  const [existing] = await db
    .select()
    .from(modelProxyModels)
    .where(eq(modelProxyModels.modelName, modelName))
    .limit(1);
  if (!existing) {
    throw new Error(`Model "${modelName}" not found`);
  }
  await db.delete(modelProxyModels).where(eq(modelProxyModels.id, existing.id));
}

export async function getRegistryProvidersImpl(): Promise<RegistryProvider[]> {
  const rows = await db
    .select()
    .from(modelProxyProviders)
    .orderBy(asc(modelProxyProviders.name));
  return rows.map((record) => ({
    providerId: record.id,
    providerName: record.name,
    providerValues: null,
    providerInfo: {
      // DB-level backward compat: apiKey column still exists alongside secretRef
      hasStoredSecret: Boolean(
        record.apiKey?.trim() || record.secretRef?.trim(),
      ),
      provider: record.provider,
    },
    createdAt: record.createdAt.toISOString(),
    createdBy: null,
    updatedAt: record.updatedAt.toISOString(),
    updatedBy: null,
  }));
}

export async function getRegistryDefaultProviderImpl(): Promise<string | null> {
  const [row] = await db
    .select()
    .from(modelProxySettings)
    .where(eq(modelProxySettings.key, DEFAULT_PROVIDER_KEY))
    .limit(1);
  if (
    !row?.value ||
    typeof row.value !== "object" ||
    Array.isArray(row.value)
  ) {
    return null;
  }
  const value = row.value as Record<string, unknown>;
  return typeof value.default_provider === "string"
    ? value.default_provider
    : null;
}

export async function setRegistryDefaultProviderImpl(
  providerAlias: string | null,
): Promise<void> {
  if (providerAlias === null || providerAlias.trim() === "") {
    await db
      .delete(modelProxySettings)
      .where(eq(modelProxySettings.key, DEFAULT_PROVIDER_KEY));
    return;
  }
  await db
    .insert(modelProxySettings)
    .values({
      id: crypto.randomUUID(),
      key: DEFAULT_PROVIDER_KEY,
      value: { default_provider: providerAlias.trim() },
    })
    .onConflictDoUpdate({
      target: modelProxySettings.key,
      set: { value: { default_provider: providerAlias.trim() } },
    });
}

export async function getRegistryHealthCheckPromptImpl(): Promise<
  string | null
> {
  const [row] = await db
    .select()
    .from(modelProxySettings)
    .where(eq(modelProxySettings.key, HEALTH_CHECK_PROMPT_KEY))
    .limit(1);
  if (
    !row?.value ||
    typeof row.value !== "object" ||
    Array.isArray(row.value)
  ) {
    return null;
  }
  const value = row.value as Record<string, unknown>;
  return typeof value.health_check_prompt === "string"
    ? value.health_check_prompt
    : null;
}
