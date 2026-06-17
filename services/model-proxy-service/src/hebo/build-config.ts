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
    select: { modelName: true },
  });

  if (proxyModels.length > 0) {
    return proxyModels.map((row) => row.modelName);
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

  for (const modelName of modelNames) {
    const row = await database.modelProxyModel.findUnique({
      where: { modelName },
    });

    let target: ResolvedUpstreamTarget;
    try {
      target = await resolveUpstreamTarget({
        database,
        modelName,
        providers,
        fallbackModels,
        row,
      });
    } catch {
      continue;
    }

    targetsByModel.set(modelName, target);

    const key = providerKey(target);
    let group = providerGroups.get(key);
    if (!group) {
      group = {
        id: `upstream-${providerGroups.size}`,
        baseUrl: target.upstreamBaseUrl,
        apiKey: readBearerToken(target.upstreamHeaders),
        mapping: {},
      };
      providerGroups.set(key, group);
    }

    if (target.upstreamModel !== modelName) {
      group.mapping[modelName] = target.upstreamModel;
    }

    providerByModel.set(modelName, group.id);
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
