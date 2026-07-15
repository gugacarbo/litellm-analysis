import { db } from "@lite-llm/database/client";
import { applicationSecretsStore } from "@lite-llm/database/schema";
import {
  modelProxyModels,
  modelProxyProviders,
  modelProxySettings,
} from "@lite-llm/database/schema/model-proxy";
import type { ModelConfig, ModelRoute } from "@lite-llm/llm-config-service";
import { providerSecretKey, toModelRoute } from "@lite-llm/llm-config-service";
import { asc, eq, inArray } from "drizzle-orm";
import type { ModelDetail, ModelEntry, RegistryProvider } from "../types/index";

const HEALTH_CHECK_PROMPT_KEY = "health_check_prompt";

function dbModelToRoute(row: typeof modelProxyModels.$inferSelect): ModelRoute {
  return {
    modelId: row.modelId,
    enabled: row.enabled,
    displayName: row.displayName ?? undefined,
    family: row.family ?? undefined,
    canonicalSlug: row.canonicalSlug ?? undefined,
    description: row.description ?? undefined,
    contextLength: row.contextLength ?? undefined,
    maxCompletionTokens: row.maxCompletionTokens ?? undefined,
    knowledgeCutoff: row.knowledgeCutoff ?? undefined,
    expirationDate: row.expirationDate ?? undefined,
    architecture: row.architecture,
    reasoning: row.reasoning,
    supportedParameters: row.supportedParameters,
    defaultParameters: row.defaultParameters,
    perRequestLimits: row.perRequestLimits,
    pricing: row.pricing,
    requestOptions: row.requestOptions ?? undefined,
  };
}

function routeToUpdateData(route: ModelRoute) {
  return {
    modelId: route.modelId,
    enabled: route.enabled ?? true,
    displayName: route.displayName,
    family: route.family,
    canonicalSlug: route.canonicalSlug,
    description: route.description,
    contextLength: route.contextLength,
    maxCompletionTokens: route.maxCompletionTokens,
    knowledgeCutoff: route.knowledgeCutoff,
    expirationDate: route.expirationDate,
    architecture: route.architecture,
    reasoning: route.reasoning,
    supportedParameters: route.supportedParameters,
    defaultParameters: route.defaultParameters,
    perRequestLimits: route.perRequestLimits,
    pricing: route.pricing ?? undefined,
    requestOptions: route.requestOptions,
  };
}

async function routeToCreateData(
  route: ModelRoute,
  fallbackProviderId?: string,
) {
  const providerName =
    route.providerName?.trim() || (await getRegistryDefaultProviderImpl());
  if (!providerName && !fallbackProviderId) {
    throw new Error(
      `Model "${route.modelId}" requires providerName or a configured default provider`,
    );
  }

  let providerId = fallbackProviderId;
  if (providerName) {
    const [provider] = await db
      .select({ id: modelProxyProviders.id })
      .from(modelProxyProviders)
      .where(eq(modelProxyProviders.name, providerName))
      .limit(1);
    if (!provider) {
      throw new Error(`Provider not found: ${providerName}`);
    }
    providerId = provider.id;
  }

  return { ...routeToUpdateData(route), providerId: providerId! };
}

export async function getRegistryModelsImpl(): Promise<ModelEntry[]> {
  const rows = await db
    .select()
    .from(modelProxyModels)
    .orderBy(asc(modelProxyModels.modelId));
  return rows.map((row) => ({
    modelName: row.modelId,
    modelRoute: dbModelToRoute(row),
  }));
}

export async function getRegistryModelDetailsImpl(): Promise<ModelDetail[]> {
  const rows = await db
    .select()
    .from(modelProxyModels)
    .orderBy(asc(modelProxyModels.modelId));
  return rows.map((row) => ({
    model_name: row.modelId,
    input_cost_per_token:
      row.pricing?.input != null ? String(row.pricing.input) : null,
    output_cost_per_token:
      row.pricing?.output != null ? String(row.pricing.output) : null,
  }));
}

export async function createRegistryModelImpl(model: {
  modelName: string;
  modelRoute?: ModelRoute;
}): Promise<void> {
  let route: ReturnType<typeof dbModelToRoute>;
  if (model.modelRoute) {
    route = { ...model.modelRoute, modelId: model.modelName };
  } else {
    route = toModelRoute({
      model: { name: model.modelName } as ModelConfig,
    });
  }
  await db.insert(modelProxyModels).values(await routeToCreateData(route));
}

export async function updateRegistryModelImpl(
  modelName: string,
  updates: {
    modelRoute?: ModelRoute;
    modelName?: string;
  },
): Promise<void> {
  const targetName = updates.modelName ?? modelName;
  let route: ModelRoute | null = null;
  if (updates.modelRoute) {
    route = { ...updates.modelRoute, modelId: targetName };
  }

  if (targetName !== modelName) {
    const [existing] = await db
      .select()
      .from(modelProxyModels)
      .where(eq(modelProxyModels.modelId, modelName))
      .limit(1);
    if (!existing) {
      throw new Error(`Model "${modelName}" not found`);
    }
    const existingRoute = dbModelToRoute(existing);
    const mergedRoute = route ?? existingRoute;
    await db
      .delete(modelProxyModels)
      .where(eq(modelProxyModels.id, existing.id));
    await db
      .insert(modelProxyModels)
      .values(
        await routeToCreateData(
          { ...mergedRoute, modelId: targetName },
          existing.providerId,
        ),
      );
    return;
  }

  if (!route) {
    return;
  }

  const [existing] = await db
    .select()
    .from(modelProxyModels)
    .where(eq(modelProxyModels.modelId, modelName))
    .limit(1);
  if (!existing) {
    throw new Error(`Model "${modelName}" not found`);
  }
  await db
    .update(modelProxyModels)
    .set(routeToUpdateData(route))
    .where(eq(modelProxyModels.id, existing.id));
}

export async function deleteRegistryModelImpl(
  modelName: string,
): Promise<void> {
  const [existing] = await db
    .select()
    .from(modelProxyModels)
    .where(eq(modelProxyModels.modelId, modelName))
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
  const credentialRows = rows.length
    ? await db
        .select({
          key: applicationSecretsStore.key,
        })
        .from(applicationSecretsStore)
        .where(
          inArray(
            applicationSecretsStore.key,
            rows.map((record) => providerSecretKey(record.id)),
          ),
        )
    : [];
  const configuredCredentials = new Set(
    credentialRows.map((record) => record.key),
  );
  return rows.map((record) => ({
    providerId: record.id,
    providerName: record.name,
    providerValues: null,
    providerInfo: {
      credentialStatus: configuredCredentials.has(providerSecretKey(record.id))
        ? "configured"
        : "missing",
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
    .from(modelProxyProviders)
    .where(eq(modelProxyProviders.isDefault, true))
    .limit(1);
  return row?.name ?? null;
}

export async function setRegistryDefaultProviderImpl(
  providerAlias: string | null,
): Promise<void> {
  if (providerAlias === null || providerAlias.trim() === "") {
    await db
      .update(modelProxyProviders)
      .set({ isDefault: false })
      .where(eq(modelProxyProviders.isDefault, true));
    return;
  }

  const [provider] = await db
    .select({ id: modelProxyProviders.id })
    .from(modelProxyProviders)
    .where(eq(modelProxyProviders.name, providerAlias.trim()))
    .limit(1);
  if (!provider) {
    throw new Error(`Provider not found: ${providerAlias.trim()}`);
  }

  await db
    .update(modelProxyProviders)
    .set({ isDefault: false })
    .where(eq(modelProxyProviders.isDefault, true));
  await db
    .update(modelProxyProviders)
    .set({ isDefault: true })
    .where(eq(modelProxyProviders.id, provider.id));
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
