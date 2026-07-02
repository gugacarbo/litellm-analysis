import {
  fromModelProxyRow,
  toModelRoute,
} from "@lite-llm/model-proxy-registry-service";
import type { ModelProxyModel, Prisma } from "@lite-llm/model-proxy-repository";
import { getModelProxyPrisma } from "@lite-llm/model-proxy-repository";
import type {
  ModelDetail,
  ModelEntry,
  RegistryProvider,
} from "../types/index";

const DEFAULT_PROVIDER_KEY = "default_provider";
const HEALTH_CHECK_PROMPT_KEY = "health_check_prompt";

function prismaModelToRoute(row: ModelProxyModel) {
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

function routeToCreateData(route: ReturnType<typeof prismaModelToRoute>) {
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
        ? (route.requestOptions as Prisma.InputJsonValue)
        : undefined,
    metadata:
      route.metadata !== undefined
        ? (route.metadata as Prisma.InputJsonValue)
        : undefined,
  };
}

export async function getRegistryModelsImpl(): Promise<ModelEntry[]> {
  const prisma = getModelProxyPrisma();
  const rows = await prisma.modelProxyModel.findMany({
    orderBy: { modelName: "asc" },
  });
  return rows.map((row) => ({
    modelName: row.modelName,
    modelRoute: prismaModelToRoute(row) as unknown as Record<string, unknown>,
  }));
}

export async function getRegistryModelDetailsImpl(): Promise<ModelDetail[]> {
  const prisma = getModelProxyPrisma();
  const rows = await prisma.modelProxyModel.findMany({
    orderBy: { modelName: "asc" },
  });
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
  modelRoute?: Record<string, unknown>;
}): Promise<void> {
  const prisma = getModelProxyPrisma();
  const route: ReturnType<typeof prismaModelToRoute> = model.modelRoute
    ? ({ modelName: model.modelName, ...model.modelRoute } as ReturnType<
        typeof prismaModelToRoute
      >)
    : toModelRoute({}, model.modelName);
  await prisma.modelProxyModel.create({
    data: routeToCreateData(route),
  });
}

export async function updateRegistryModelImpl(
  modelName: string,
  updates: {
    modelRoute?: Record<string, unknown>;
    modelName?: string;
  },
): Promise<void> {
  const prisma = getModelProxyPrisma();
  const targetName = updates.modelName ?? modelName;
  const route = updates.modelRoute
    ? ({
        modelName: targetName,
        ...updates.modelRoute,
      } as ReturnType<typeof prismaModelToRoute>)
    : null;

  if (targetName !== modelName) {
    const existing = await prisma.modelProxyModel.findUnique({
      where: { modelName },
    });
    if (!existing) {
      throw new Error(`Model "${modelName}" not found`);
    }
    const existingRoute = prismaModelToRoute(existing);
    const mergedRoute = route ?? existingRoute;
    await prisma.modelProxyModel.delete({ where: { modelName } });
    await prisma.modelProxyModel.create({
      data: routeToCreateData({ ...mergedRoute, modelName: targetName }),
    });
    return;
  }

  if (!route) {
    return;
  }

  const updated = await prisma.modelProxyModel.update({
    where: { modelName },
    data: routeToCreateData(route),
  });
  if (!updated) {
    throw new Error(`Model "${modelName}" not found`);
  }
}

export async function deleteRegistryModelImpl(
  modelName: string,
): Promise<void> {
  const prisma = getModelProxyPrisma();
  try {
    await prisma.modelProxyModel.delete({ where: { modelName } });
  } catch {
    throw new Error(`Model "${modelName}" not found`);
  }
}

export async function getRegistryProvidersImpl(): Promise<
  RegistryProvider[]
> {
  const prisma = getModelProxyPrisma();
  const rows = await prisma.modelProxyProvider.findMany({
    orderBy: { name: "asc" },
  });
  return rows.map((record) => ({
    providerId: record.id,
    providerName: record.name,
    providerValues: null,
    providerInfo: {
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

export async function getRegistryDefaultProviderImpl(): Promise<
  string | null
> {
  const prisma = getModelProxyPrisma();
  const row = await prisma.modelProxySetting.findUnique({
    where: { key: DEFAULT_PROVIDER_KEY },
  });
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
  const prisma = getModelProxyPrisma();
  if (providerAlias === null || providerAlias.trim() === "") {
    await prisma.modelProxySetting.deleteMany({
      where: { key: DEFAULT_PROVIDER_KEY },
    });
    return;
  }
  await prisma.modelProxySetting.upsert({
    where: { key: DEFAULT_PROVIDER_KEY },
    create: {
      key: DEFAULT_PROVIDER_KEY,
      value: { default_provider: providerAlias.trim() },
    },
    update: {
      value: { default_provider: providerAlias.trim() },
    },
  });
}

export async function getRegistryHealthCheckPromptImpl(): Promise<
  string | null
> {
  const prisma = getModelProxyPrisma();
  const row = await prisma.modelProxySetting.findUnique({
    where: { key: HEALTH_CHECK_PROMPT_KEY },
  });
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
