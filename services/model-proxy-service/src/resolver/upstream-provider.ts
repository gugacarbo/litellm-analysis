import { serverEnv } from "@lite-llm/config/server";
import { OPENAI_CHATGPT_API_BASE } from "@lite-llm/model-proxy-registry-service";
import type {
  ModelProxyModel,
  PrismaClient,
} from "@lite-llm/model-proxy-repository";
import type {
  ModelSpec,
  Provider,
} from "@lite-llm/models-repository/repository";

export const CHATGPT_SUBSCRIPTION_PROVIDER = "chatgpt-subscription";

type UpstreamAuthMode = "bearer" | "openai-chatgpt-oauth";

export interface ResolvedUpstreamTarget {
  authMode: UpstreamAuthMode;
  cost: { input?: number; output?: number };
  displayName?: string;
  model: string;
  ownedBy: string;
  upstreamBaseUrl: string;
  upstreamHeaders: HeadersInit;
  upstreamModel: string;
}

function normalizeBaseUrl(raw: string): string {
  return raw.replace(/\/+$/, "");
}

function readSecretRef(secretRef?: string | null): string | undefined {
  const trimmed = secretRef?.trim();
  if (!trimmed) {
    return undefined;
  }

  const envValue = process.env[trimmed];
  return envValue?.trim() ? envValue.trim() : undefined;
}

function readProviderApiKey(provider?: Provider): string | undefined {
  const apiKey = provider?.apiKey?.trim();
  if (!apiKey) {
    return undefined;
  }

  if (apiKey.startsWith("env:")) {
    const envName = apiKey.slice(4).trim();
    const envValue = process.env[envName];
    return envValue?.trim() ? envValue.trim() : undefined;
  }

  return apiKey;
}

export function findUpstreamProvider(
  providers: Record<string, Provider>,
  modelSpec?: ModelSpec,
  row?: ModelProxyModel | null,
): Provider | undefined {
  const candidateKeys = [
    row?.ownedBy,
    row?.family ?? undefined,
    modelSpec?.ownedBy,
    modelSpec?.family,
  ].filter((value): value is string => !!value?.trim());

  for (const key of candidateKeys) {
    if (key === CHATGPT_SUBSCRIPTION_PROVIDER) {
      return {
        name: "ChatGPT Subscription",
        adapter: "openai-compatible",
        ownedBy: CHATGPT_SUBSCRIPTION_PROVIDER,
        baseUrl: OPENAI_CHATGPT_API_BASE,
        defaultCredential: "",
      };
    }

    const provider = providers[key];
    if (provider?.adapter && key !== "local-proxy") {
      return provider;
    }
  }

  return undefined;
}

export async function resolveUpstreamTarget(params: {
  database: PrismaClient;
  modelName: string;
  providers: Record<string, Provider>;
  fallbackModels: Record<string, ModelSpec>;
  row?: ModelProxyModel | null;
}): Promise<ResolvedUpstreamTarget> {
  const { database, modelName, providers, fallbackModels, row } = params;
  const fallbackSpec = fallbackModels[modelName];

  if (!row && !fallbackSpec) {
    throw new Error(`Model "${modelName}" not found`);
  }

  if (row?.enabled === false) {
    throw new Error(`Model "${modelName}" is disabled`);
  }

  const upstreamProvider = findUpstreamProvider(providers, fallbackSpec, row);

  const credentialName =
    row?.credentialName?.trim() ||
    upstreamProvider?.defaultCredential?.trim() ||
    undefined;

  const credential = credentialName
    ? await database.modelProxyCredential.findUnique({
        where: { name: credentialName },
      })
    : null;

  const upstreamBaseUrl =
    row?.upstreamBaseUrl?.trim() ||
    upstreamProvider?.baseUrl?.trim() ||
    credential?.baseUrl?.trim() ||
    serverEnv.MODEL_PROXY_UPSTREAM_BASE_URL?.trim();

  if (!upstreamBaseUrl) {
    throw new Error(`No upstream base URL configured for model "${modelName}"`);
  }

  const envSecret =
    readSecretRef(row?.secretRef) ?? readSecretRef(credential?.secretRef);
  const isChatGptSubscription =
    upstreamProvider?.ownedBy === CHATGPT_SUBSCRIPTION_PROVIDER;

  const upstreamApiKey =
    envSecret ||
    credential?.apiKey?.trim() ||
    readProviderApiKey(upstreamProvider) ||
    serverEnv.MODEL_PROXY_UPSTREAM_API_KEY?.trim();

  if (!isChatGptSubscription && !upstreamApiKey) {
    throw new Error(`No upstream API key configured for model "${modelName}"`);
  }

  return {
    authMode: isChatGptSubscription ? "openai-chatgpt-oauth" : "bearer",
    model: modelName,
    upstreamModel: row?.upstreamModel?.trim() || modelName,
    upstreamBaseUrl: normalizeBaseUrl(upstreamBaseUrl),
    upstreamHeaders: isChatGptSubscription
      ? {}
      : {
          authorization: `Bearer ${upstreamApiKey}`,
        },
    ownedBy:
      row?.ownedBy ??
      fallbackSpec?.ownedBy ??
      fallbackSpec?.family ??
      "local-proxy",
    displayName: row?.displayName ?? fallbackSpec?.displayName,
    cost: {
      input: row?.inputCostPerToken ?? fallbackSpec?.cost?.input,
      output: row?.outputCostPerToken ?? fallbackSpec?.cost?.output,
    },
  };
}
