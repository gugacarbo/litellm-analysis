import { getModelProxyPrisma } from "@lite-llm/model-proxy-repository";
import type {
  LiteLLMCredential,
  ModelDetail,
  ModelEntry,
} from "../types/index";

const ROUTER_SETTINGS_KEY = "router_settings";
const DEFAULT_CREDENTIAL_KEY = "default_credential";
const HEALTH_CHECK_PROMPT_KEY = "health_check_prompt";

function routeToLitellmParams(row: {
  modelName: string;
  enabled: boolean;
  upstreamModel: string | null;
  upstreamBaseUrl: string | null;
  credentialName: string | null;
  contextWindowSize: number | null;
  maxOutputTokens: number | null;
  inputCostPerToken: unknown;
  outputCostPerToken: unknown;
  requestOptions: unknown;
}): Record<string, unknown> {
  const options =
    row.requestOptions !== null &&
    typeof row.requestOptions === "object" &&
    !Array.isArray(row.requestOptions)
      ? (row.requestOptions as Record<string, unknown>)
      : {};

  return {
    ...options,
    model: row.upstreamModel ?? row.modelName,
    api_base: row.upstreamBaseUrl ?? undefined,
    litellm_credential_name: row.credentialName ?? undefined,
    enabled: row.enabled,
    context_window_size: row.contextWindowSize ?? undefined,
    max_tokens: row.maxOutputTokens ?? undefined,
    input_cost_per_token: row.inputCostPerToken ?? undefined,
    output_cost_per_token: row.outputCostPerToken ?? undefined,
  };
}

function litellmParamsToRoute(
  modelName: string,
  params: Record<string, unknown>,
): Record<string, unknown> {
  return {
    modelName,
    enabled: (params.enabled as boolean | undefined) ?? true,
    upstreamModel:
      (params.model as string | undefined) ??
      (params.upstream_model as string | undefined) ??
      modelName,
    upstreamBaseUrl: params.api_base as string | undefined,
    credentialName: params.litellm_credential_name as string | undefined,
    contextWindowSize: params.context_window_size as number | undefined,
    maxOutputTokens: params.max_tokens as number | undefined,
    inputCostPerToken: params.input_cost_per_token as number | undefined,
    outputCostPerToken: params.output_cost_per_token as number | undefined,
    requestOptions: Object.fromEntries(
      Object.entries(params).filter(
        ([key]) =>
          ![
            "model",
            "api_base",
            "litellm_credential_name",
            "enabled",
            "context_window_size",
            "max_tokens",
            "input_cost_per_token",
            "output_cost_per_token",
          ].includes(key),
      ),
    ),
  };
}

export async function getRegistryModelsImpl(): Promise<ModelEntry[]> {
  const prisma = getModelProxyPrisma();
  const rows = await prisma.modelProxyModel.findMany({
    orderBy: { modelName: "asc" },
  });
  return rows.map((row) => ({
    modelName: row.modelName,
    litellmParams: routeToLitellmParams(row),
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
  litellmParams: Record<string, unknown>;
}): Promise<void> {
  const prisma = getModelProxyPrisma();
  const route = litellmParamsToRoute(model.modelName, model.litellmParams);
  await prisma.modelProxyModel.create({
    data: {
      modelName: model.modelName,
      enabled: (route.enabled as boolean) ?? true,
      upstreamModel: route.upstreamModel as string,
      upstreamBaseUrl: (route.upstreamBaseUrl as string | undefined) ?? "",
      credentialName: route.credentialName as string | undefined,
      contextWindowSize: route.contextWindowSize as number | undefined,
      maxOutputTokens: route.maxOutputTokens as number | undefined,
      inputCostPerToken: route.inputCostPerToken as number | undefined,
      outputCostPerToken: route.outputCostPerToken as number | undefined,
      requestOptions: route.requestOptions as object | undefined,
    },
  });
}

export async function updateRegistryModelImpl(
  modelName: string,
  updates: {
    litellmParams?: Record<string, unknown>;
    modelName?: string;
  },
): Promise<void> {
  const prisma = getModelProxyPrisma();
  const targetName = updates.modelName ?? modelName;
  const route = updates.litellmParams
    ? litellmParamsToRoute(targetName, updates.litellmParams)
    : null;

  if (targetName !== modelName) {
    const existing = await prisma.modelProxyModel.findUnique({
      where: { modelName },
    });
    if (!existing) {
      throw new Error(`Model "${modelName}" not found`);
    }
    await prisma.modelProxyModel.delete({ where: { modelName } });
    await prisma.modelProxyModel.create({
      data: {
        modelName: targetName,
        enabled: (route?.enabled as boolean) ?? existing.enabled,
        upstreamModel:
          (route?.upstreamModel as string | undefined) ??
          existing.upstreamModel ??
          targetName,
        upstreamBaseUrl:
          (route?.upstreamBaseUrl as string | undefined) ??
          existing.upstreamBaseUrl ??
          "",
        credentialName:
          (route?.credentialName as string | undefined) ??
          existing.credentialName ??
          undefined,
        contextWindowSize:
          (route?.contextWindowSize as number | undefined) ??
          existing.contextWindowSize ??
          undefined,
        maxOutputTokens:
          (route?.maxOutputTokens as number | undefined) ??
          existing.maxOutputTokens ??
          undefined,
        inputCostPerToken:
          (route?.inputCostPerToken as number | undefined) ??
          existing.inputCostPerToken ??
          undefined,
        outputCostPerToken:
          (route?.outputCostPerToken as number | undefined) ??
          existing.outputCostPerToken ??
          undefined,
        requestOptions:
          (route?.requestOptions as object | undefined) ??
          (existing.requestOptions as object | undefined),
      },
    });
    return;
  }

  if (!route) {
    return;
  }

  const updated = await prisma.modelProxyModel.update({
    where: { modelName },
    data: {
      enabled: route.enabled as boolean | undefined,
      upstreamModel: route.upstreamModel as string | undefined,
      upstreamBaseUrl: route.upstreamBaseUrl as string | undefined,
      credentialName: route.credentialName as string | undefined,
      contextWindowSize: route.contextWindowSize as number | undefined,
      maxOutputTokens: route.maxOutputTokens as number | undefined,
      inputCostPerToken: route.inputCostPerToken as number | undefined,
      outputCostPerToken: route.outputCostPerToken as number | undefined,
      requestOptions: route.requestOptions as object | undefined,
    },
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

export async function getRegistryCredentialsImpl(): Promise<
  LiteLLMCredential[]
> {
  const prisma = getModelProxyPrisma();
  const rows = await prisma.modelProxyCredential.findMany({
    orderBy: { name: "asc" },
  });
  return rows.map((record) => ({
    credentialId: record.id,
    credentialName: record.name,
    credentialValues: null,
    credentialInfo: {
      secretRef: record.secretRef,
      provider: record.provider,
    },
    createdAt: record.createdAt.toISOString(),
    createdBy: null,
    updatedAt: record.updatedAt.toISOString(),
    updatedBy: null,
  }));
}

export async function getRegistryDefaultCredentialImpl(): Promise<
  string | null
> {
  const prisma = getModelProxyPrisma();
  const row = await prisma.modelProxySetting.findUnique({
    where: { key: DEFAULT_CREDENTIAL_KEY },
  });
  if (
    !row?.value ||
    typeof row.value !== "object" ||
    Array.isArray(row.value)
  ) {
    return null;
  }
  const value = row.value as Record<string, unknown>;
  return typeof value.default_credential === "string"
    ? value.default_credential
    : null;
}

export async function setRegistryDefaultCredentialImpl(
  credentialAlias: string | null,
): Promise<void> {
  const prisma = getModelProxyPrisma();
  if (credentialAlias === null || credentialAlias.trim() === "") {
    await prisma.modelProxySetting.deleteMany({
      where: { key: DEFAULT_CREDENTIAL_KEY },
    });
    return;
  }
  await prisma.modelProxySetting.upsert({
    where: { key: DEFAULT_CREDENTIAL_KEY },
    create: {
      key: DEFAULT_CREDENTIAL_KEY,
      value: { default_credential: credentialAlias.trim() },
    },
    update: {
      value: { default_credential: credentialAlias.trim() },
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
