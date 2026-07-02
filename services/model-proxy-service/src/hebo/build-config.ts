import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { ProviderV3 } from "@ai-sdk/provider";
import {
  defineModelCatalog,
  type ModelCatalog,
  withCanonicalIds,
} from "@hebo-ai/gateway";
import type { PrismaClient } from "@lite-llm/model-proxy-repository";
import { getModelProxyPrisma } from "@lite-llm/model-proxy-repository";
import type { IModelService, IProviderService } from "@lite-llm/models-service";
import {
  type ResolvedUpstreamTarget,
  parseProviderModel,
  resolveUpstreamTarget,
} from "../resolver/upstream-provider";

const DEFAULT_CAPABILITIES = [
  "attachments",
  "reasoning",
  "tool_call",
  "structured_output",
  "temperature",
] as const;

const DEFAULT_INPUT_MODALITIES = ["text", "image", "file"] as const;
const DEFAULT_OUTPUT_MODALITIES = ["text"] as const;

interface ProviderGroup {
  apiKey: string;
  authMode: ResolvedUpstreamTarget["authMode"];
  baseUrl: string;
  id: string;
  mapping: Record<string, string>;
}

export interface HeboGatewayBuildResult {
  models: ModelCatalog;
  providerByModel: Map<string, string>;
  providers: Record<string, ProviderV3>;
  targetsByModel: Map<string, ResolvedUpstreamTarget>;
}

function readBearerToken(headers: HeadersInit): string {
  if (headers instanceof Headers) {
    const value = headers.get("authorization");
    if (!value) {
      return "";
    }
    const match = value.match(/^Bearer\s+(.+)$/i);
    return match?.[1]?.trim() ?? "";
  }

  if (Array.isArray(headers)) {
    for (const [key, value] of headers) {
      if (key.toLowerCase() === "authorization") {
        const match = value.match(/^Bearer\s+(.+)$/i);
        return match?.[1]?.trim() ?? "";
      }
    }
    return "";
  }

  const raw = headers.authorization;
  if (typeof raw !== "string") {
    return "";
  }

  const match = raw.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? "";
}

function providerKey(target: ResolvedUpstreamTarget): string {
  if (target.authMode === "openai-chatgpt-oauth") {
    return `${target.authMode}|${target.upstreamBaseUrl}`;
  }
  const token = readBearerToken(target.upstreamHeaders);
  return `${target.upstreamBaseUrl}|${token}`;
}

async function listProxyModelNames(
  database: PrismaClient,
  modelsService: IModelService,
): Promise<string[]> {
  const proxyModels = await database.modelProxyModel.findMany({
    where: { enabled: true },
    orderBy: { modelName: "asc" },
    select: { modelName: true, providerName: true },
  });

  if (proxyModels.length > 0) {
    return proxyModels.map((row) =>
      row.providerName
        ? `${row.providerName}/${row.modelName}`
        : row.modelName,
    );
  }

  const fallbackModels = await modelsService.getAll();
  return Object.entries(fallbackModels)
    .filter(([, spec]) => spec.enabled !== false)
    .map(([name]) => name)
    .sort((left, right) => left.localeCompare(right));
}

export async function buildHeboGatewayConfig(options: {
  database?: PrismaClient;
  modelsService: IModelService;
  providerService: IProviderService;
}): Promise<HeboGatewayBuildResult> {
  const database = options.database ?? getModelProxyPrisma();
  const providers = await options.providerService.getAll();
  const fallbackModels = await options.modelsService.getAll();
  const modelNames = await listProxyModelNames(database, options.modelsService);

  const targetsByModel = new Map<string, ResolvedUpstreamTarget>();
  const providerGroups = new Map<string, ProviderGroup>();
  const providerByModel = new Map<string, string>();

  // Batch-count rows per bare model name for multi-provider detection
  const bareNameCounts = new Map<string, number>();
  for (const modelName of modelNames) {
    const { bareModelName } = parseProviderModel(modelName);
    if (!bareNameCounts.has(bareModelName)) {
      const count = await database.modelProxyModel.count({
        where: { modelName: bareModelName },
      });
      bareNameCounts.set(bareModelName, count);
    }
  }

  for (const modelName of modelNames) {
    let target: ResolvedUpstreamTarget;
    try {
      target = await resolveUpstreamTarget({
        database,
        modelName,
        providers,
        fallbackModels,
      });
    } catch {
      continue;
    }

    const { bareModelName, providerPrefix } = parseProviderModel(modelName);
    const rowCount = bareNameCounts.get(bareModelName) ?? 1;

    // Determine catalog keys for this model
    const catalogKeys: string[] = [];

    if (rowCount === 1) {
      // Single-provider: register under bare name
      catalogKeys.push(bareModelName);
    } else {
      // Multi-provider: always register under provider/model
      catalogKeys.push(modelName);

      // Also register under bare name if this is the default provider
      if (providerPrefix) {
        const resolvedRow = await database.modelProxyModel.findFirst({
          where: {
            modelName: bareModelName,
            providerName: providerPrefix,
          },
        });
        if (resolvedRow?.isDefaultProvider) {
          catalogKeys.push(bareModelName);
        }
      }
    }

    for (const catalogKey of catalogKeys) {
      targetsByModel.set(catalogKey, target);

      const key = providerKey(target);
      let group = providerGroups.get(key);
      if (!group) {
        group = {
          id: `upstream-${providerGroups.size}`,
          baseUrl: target.upstreamBaseUrl,
          apiKey:
            target.authMode === "openai-chatgpt-oauth"
              ? "oauth-placeholder"
              : readBearerToken(target.upstreamHeaders),
          authMode: target.authMode,
          mapping: {},
        };
        providerGroups.set(key, group);
      }

      if (target.upstreamModel !== catalogKey) {
        group.mapping[catalogKey] = target.upstreamModel;
      }

      providerByModel.set(catalogKey, group.id);
    }
  }

  // Warn about ambiguous models with no default
  const processedBareNames = new Set<string>();
  for (const modelName of modelNames) {
    const { bareModelName } = parseProviderModel(modelName);
    if (processedBareNames.has(bareModelName)) {
      continue;
    }
    processedBareNames.add(bareModelName);

    const rowCount = bareNameCounts.get(bareModelName) ?? 1;
    if (rowCount > 1) {
      const hasDefault = await database.modelProxyModel.findFirst({
        where: { modelName: bareModelName, isDefaultProvider: true },
      });
      if (!hasDefault) {
        console.warn(
          `[hebo] Ambiguous model "${bareModelName}" has ${rowCount} providers but no default — use "provider/${bareModelName}" to specify`,
        );
      }
    }
  }

  const providerRegistry: Record<string, ProviderV3> = {};
  for (const group of providerGroups.values()) {
    providerRegistry[group.id] = withCanonicalIds(
      createOpenAICompatible({
        name: group.id,
        baseURL: group.baseUrl,
        apiKey: group.apiKey,
      }),
      { mapping: group.mapping },
    );
  }

  const catalogEntries: ModelCatalog = {};
  for (const [modelName, providerId] of providerByModel) {
    const target = targetsByModel.get(modelName);
    catalogEntries[modelName] = {
      name: target?.displayName ?? modelName,
      providers: [providerId],
      capabilities: [...DEFAULT_CAPABILITIES],
      modalities: {
        input: [...DEFAULT_INPUT_MODALITIES],
        output: [...DEFAULT_OUTPUT_MODALITIES],
      },
    };
  }

  return {
    providers: providerRegistry,
    models: defineModelCatalog(catalogEntries),
    targetsByModel,
    providerByModel,
  };
}
