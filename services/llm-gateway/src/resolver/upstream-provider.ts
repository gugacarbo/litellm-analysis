import { db } from "@lite-llm/database/client";
import { applicationSecretsStore } from "@lite-llm/database/schema";
import {
  type ModelProxyModel,
  modelProxyModels,
  modelProxyProviders,
} from "@lite-llm/database/schema/model-proxy";
import {
  OPENAI_CHATGPT_API_BASE,
  parseProviderEncryptionKey,
  providerSecretKey,
  resolveProviderCredential,
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
      provider.name?.trim() === trimmedProviderName
    );
  })?.[1];
}

function normalizeBaseUrl(raw: string): string {
  return raw.replace(/\/+$/, "");
}

export function findUpstreamProvider(
  providers: Record<string, Provider>,
  row?: ModelProxyModel | null,
  providerName?: string,
): Provider | undefined {
  if (providerName) {
    const providerFromModel = resolveProviderByName(providers, providerName);
    if (providerFromModel) {
      return providerFromModel;
    }
  }

  const candidateKeys = [row?.family ?? undefined].filter(
    (value): value is string => !!value?.trim(),
  );

  for (const key of candidateKeys) {
    if (key === CHATGPT_SUBSCRIPTION_PROVIDER) {
      return {
        name: "ChatGPT Subscription",
        adapter: "openai-compatible",
        ownedBy: CHATGPT_SUBSCRIPTION_PROVIDER,
        baseUrl: OPENAI_CHATGPT_API_BASE,
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
        .select({
          row: modelProxyModels,
        })
        .from(modelProxyModels)
        .innerJoin(
          modelProxyProviders,
          eq(modelProxyModels.providerId, modelProxyProviders.id),
        )
        .where(
          and(
            eq(modelProxyModels.modelId, bareModelName),
            eq(modelProxyProviders.name, providerPrefix),
          ),
        )
        .limit(1);
      resolvedRow = found?.row ?? null;
      if (!resolvedRow) {
        throw new Error(`Model "${modelName}" not found`);
      }
    } else {
      const rows = await db
        .select({
          row: modelProxyModels,
          providerIsDefault: modelProxyProviders.isDefault,
        })
        .from(modelProxyModels)
        .leftJoin(
          modelProxyProviders,
          eq(modelProxyModels.providerId, modelProxyProviders.id),
        )
        .where(eq(modelProxyModels.modelId, bareModelName));

      if (rows.length === 1) {
        resolvedRow = rows[0]?.row ?? null;
      } else if (rows.length > 1) {
        const defaultRows = rows.filter((r) => r.providerIsDefault === true);
        if (defaultRows.length === 1) {
          resolvedRow = defaultRows[0]?.row ?? null;
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

  const dbProvider = resolvedRow.providerId
    ? await db
        .select()
        .from(modelProxyProviders)
        .where(eq(modelProxyProviders.id, resolvedRow.providerId))
        .limit(1)
        .then((r) => r[0] ?? null)
    : null;

  const providerName = dbProvider?.name?.trim() || undefined;

  const upstreamProvider = findUpstreamProvider(
    providers,
    resolvedRow,
    providerName,
  );

  const effectiveDbProvider = dbProvider;

  const upstreamBaseUrl =
    effectiveDbProvider?.baseUrl?.trim() || upstreamProvider?.baseUrl?.trim();

  if (!upstreamBaseUrl) {
    throw new Error(`No upstream base URL configured for model "${modelName}"`);
  }

  const isChatGptSubscription =
    upstreamProvider?.ownedBy === CHATGPT_SUBSCRIPTION_PROVIDER;

  const storedCredential = effectiveDbProvider
    ? await db
        .select({
          credentialEnvelope: applicationSecretsStore.credentialEnvelope,
        })
        .from(applicationSecretsStore)
        .where(
          eq(
            applicationSecretsStore.key,
            providerSecretKey(effectiveDbProvider.id),
          ),
        )
        .limit(1)
        .then((rows) => rows[0] ?? null)
    : null;

  const upstreamCredential = isChatGptSubscription
    ? undefined
    : resolveProviderCredential(
        { credentialEnvelope: storedCredential?.credentialEnvelope ?? null },
        parseProviderEncryptionKey(),
      );

  return {
    authMode: isChatGptSubscription ? "openai-chatgpt-oauth" : "bearer",
    model: modelName,
    upstreamModel: bareModelName,
    upstreamBaseUrl: normalizeBaseUrl(upstreamBaseUrl),
    upstreamHeaders: isChatGptSubscription
      ? {}
      : {
          authorization: `Bearer ${upstreamCredential}`,
        },
    ownedBy: resolvedRow.family ?? "local-proxy",
    displayName: resolvedRow.displayName ?? undefined,
    cost: {
      input: resolvedRow.pricing?.input,
      output: resolvedRow.pricing?.output,
    },
  };
}
