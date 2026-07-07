import { db } from "@lite-llm/database/client";
import {
  type ModelProxyModel,
  modelProxyModels,
  modelProxyProviders,
} from "@lite-llm/database/schema/model-proxy";
import {
  OPENAI_CHATGPT_API_BASE,
  resolveProviderApiKey,
} from "@lite-llm/llm-config-service";
import type { Provider } from "@lite-llm/models-repository";
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

function resolveProviderByName(
  providers: Record<string, Provider>,
  providerName?: string | null,
): Provider | undefined {
  const trimmedProviderName = providerName?.trim();
  if (!trimmedProviderName) {
    return undefined;
  }

  return Object.entries(providers).find(([key, provider]) => {
    return (
      key === trimmedProviderName ||
      provider.defaultProvider?.trim() === trimmedProviderName ||
      provider.name?.trim() === trimmedProviderName
    );
  })?.[1];
}

function normalizeBaseUrl(raw: string): string {
  return raw.replace(/\/+$/, "");
}

function readSecretRef(secretRef?: string | null): string | undefined {
  if (!secretRef?.trim()) {
    return undefined;
  }
  const val = process.env[secretRef.trim()];
  return val?.trim() || undefined;
}

function resolveStoredProviderApiKey(
  provider?: {
    apiKey?: string | null;
  } | null,
): string | undefined {
  if (!provider) {
    return undefined;
  }

  return resolveProviderApiKey(provider);
}

export function findUpstreamProvider(
  providers: Record<string, Provider>,
  row?: ModelProxyModel | null,
): Provider | undefined {
  const providerFromModel = resolveProviderByName(providers, row?.providerName);
  if (providerFromModel) {
    return providerFromModel;
  }

  const candidateKeys = [row?.ownedBy, row?.family ?? undefined].filter(
    (value): value is string => !!value?.trim(),
  );

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
  row?: ModelProxyModel | null;
}): Promise<ResolvedUpstreamTarget> {
  const { modelName, providers, row } = params;
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

  if (!resolvedRow) {
    throw new Error(`Model "${modelName}" not found`);
  }

  if (resolvedRow.enabled === false) {
    throw new Error(`Model "${modelName}" is disabled`);
  }

  const upstreamProvider = findUpstreamProvider(providers, resolvedRow);

  const providerName =
    resolvedRow.providerName?.trim() ||
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
    resolvedRow.upstreamBaseUrl?.trim() ||
    provider?.baseUrl?.trim() ||
    upstreamProvider?.baseUrl?.trim();

  if (!upstreamBaseUrl) {
    throw new Error(`No upstream base URL configured for model "${modelName}"`);
  }

  const envSecret = readSecretRef(resolvedRow.secretRef);
  const isChatGptSubscription =
    upstreamProvider?.ownedBy === CHATGPT_SUBSCRIPTION_PROVIDER;

  const upstreamApiKey = envSecret || resolveStoredProviderApiKey(provider);

  if (!isChatGptSubscription && !upstreamApiKey) {
    throw new Error(`No upstream API key configured for model "${modelName}"`);
  }

  return {
    authMode: isChatGptSubscription ? "openai-chatgpt-oauth" : "bearer",
    model: modelName,
    upstreamModel: resolvedRow.upstreamModel?.trim() || bareModelName,
    upstreamBaseUrl: normalizeBaseUrl(upstreamBaseUrl),
    upstreamHeaders: isChatGptSubscription
      ? {}
      : {
          authorization: `Bearer ${upstreamApiKey}`,
        },
    ownedBy: resolvedRow.ownedBy ?? resolvedRow.family ?? "local-proxy",
    displayName: resolvedRow.displayName ?? undefined,
    cost: {
      input: resolvedRow.inputCostPerToken ?? undefined,
      output: resolvedRow.outputCostPerToken ?? undefined,
    },
  };
}
