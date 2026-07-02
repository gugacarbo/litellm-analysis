import { db } from "@lite-llm/database/client";
import {
  type ModelProxyModel,
  modelProxyModels,
  modelProxyProviders,
} from "@lite-llm/database/schema/model-proxy";
import {
  OPENAI_CHATGPT_API_BASE,
  resolveProviderSecret,
} from "@lite-llm/model-proxy-config-service";
import type { ModelSpec, Provider } from "@lite-llm/models-repository";
import { and, eq } from "drizzle-orm";

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

function looksLikeEnvVarName(value: string): boolean {
  return /^[A-Za-z_][A-Za-z0-9_]*$/.test(value);
}

function readSecretRef(secretRef?: string | null): string | undefined {
  const trimmed = secretRef?.trim();
  if (!trimmed) {
    return undefined;
  }

  if (!looksLikeEnvVarName(trimmed)) {
    return trimmed;
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
        defaultProvider: "",
      };
    }

    const provider = providers[key];
    if (provider?.adapter && key !== "local-proxy") {
      return provider;
    }
  }

  return undefined;
}

export function parseProviderModel(rawModel: string): {
  providerPrefix?: string;
  bareModelName: string;
} {
  const trimmed = rawModel.trim();
  const slashIndex = trimmed.indexOf("/");

  if (slashIndex === -1 || slashIndex === 0) {
    return { bareModelName: trimmed };
  }

  const prefix = trimmed.slice(0, slashIndex);
  const model = trimmed.slice(slashIndex + 1);

  if (!model) {
    return { bareModelName: trimmed };
  }

  return { providerPrefix: prefix, bareModelName: model };
}

export async function resolveUpstreamTarget(params: {
  modelName: string;
  providers: Record<string, Provider>;
  fallbackModels: Record<string, ModelSpec>;
  row?: ModelProxyModel | null;
}): Promise<ResolvedUpstreamTarget> {
  const { modelName, providers, fallbackModels, row } = params;
  const { providerPrefix, bareModelName } = parseProviderModel(modelName);

  let resolvedRow: ModelProxyModel | null = row ?? null;

  if (!resolvedRow) {
    if (providerPrefix) {
      const [found] = await db
        .select()
        .from(modelProxyModels)
        .where(
          and(
            eq(modelProxyModels.modelName, bareModelName),
            eq(modelProxyModels.providerName, providerPrefix),
          ),
        )
        .limit(1);
      resolvedRow = found ?? null;
      if (!resolvedRow) {
        throw new Error(`Model "${modelName}" not found`);
      }
    } else {
      const rows = await db
        .select()
        .from(modelProxyModels)
        .where(eq(modelProxyModels.modelName, bareModelName));

      if (rows.length === 1) {
        resolvedRow = rows[0];
      } else if (rows.length > 1) {
        const defaultRows = rows.filter((r) => r.isDefaultProvider);
        if (defaultRows.length === 1) {
          resolvedRow = defaultRows[0];
        } else if (defaultRows.length === 0) {
          throw new Error(
            `Ambiguous model "${bareModelName}" — multiple providers available. Use "provider/${bareModelName}" to specify.`,
          );
        } else {
          throw new Error(
            `Multiple default providers configured for model "${bareModelName}"`,
          );
        }
      }
    }
  }

  const fallbackSpec = fallbackModels[bareModelName];

  if (!resolvedRow && !fallbackSpec) {
    throw new Error(`Model "${modelName}" not found`);
  }

  if (resolvedRow?.enabled === false) {
    throw new Error(`Model "${modelName}" is disabled`);
  }

  const upstreamProvider = findUpstreamProvider(
    providers,
    fallbackSpec,
    resolvedRow,
  );

  const providerName =
    resolvedRow?.providerName?.trim() ||
    upstreamProvider?.defaultProvider?.trim() ||
    undefined;

  const [provider] = providerName
    ? await db
        .select()
        .from(modelProxyProviders)
        .where(eq(modelProxyProviders.name, providerName))
        .limit(1)
    : [null];

  const upstreamBaseUrl =
    resolvedRow?.upstreamBaseUrl?.trim() ||
    upstreamProvider?.baseUrl?.trim() ||
    provider?.baseUrl?.trim();

  if (!upstreamBaseUrl) {
    throw new Error(`No upstream base URL configured for model "${modelName}"`);
  }

  const envSecret = readSecretRef(resolvedRow?.secretRef);
  const isChatGptSubscription =
    upstreamProvider?.ownedBy === CHATGPT_SUBSCRIPTION_PROVIDER;

  const upstreamApiKey =
    envSecret ||
    (provider ? resolveProviderSecret(provider) : undefined) ||
    readProviderApiKey(upstreamProvider);

  if (!isChatGptSubscription && !upstreamApiKey) {
    throw new Error(`No upstream API key configured for model "${modelName}"`);
  }

  return {
    authMode: isChatGptSubscription ? "openai-chatgpt-oauth" : "bearer",
    model: modelName,
    upstreamModel: resolvedRow?.upstreamModel?.trim() || bareModelName,
    upstreamBaseUrl: normalizeBaseUrl(upstreamBaseUrl),
    upstreamHeaders: isChatGptSubscription
      ? {}
      : {
          authorization: `Bearer ${upstreamApiKey}`,
        },
    ownedBy:
      resolvedRow?.ownedBy ??
      fallbackSpec?.ownedBy ??
      fallbackSpec?.family ??
      "local-proxy",
    displayName: resolvedRow?.displayName ?? fallbackSpec?.displayName,
    cost: {
      input: resolvedRow?.inputCostPerToken ?? fallbackSpec?.cost?.input,
      output: resolvedRow?.outputCostPerToken ?? fallbackSpec?.cost?.output,
    },
  };
}
