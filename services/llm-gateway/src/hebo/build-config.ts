import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import type { ProviderV3 } from "@ai-sdk/provider";
import {
  defineModelCatalog,
  type ModelCatalog,
  withCanonicalIds,
} from "@hebo-ai/gateway";
import { db } from "@lite-llm/database/client";
import { modelProxyModels } from "@lite-llm/database/schema/model-proxy";
import { eq, asc } from "drizzle-orm";
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

interface ProxyCatalogRow {
  isDefaultProvider: boolean;
  modelName: string;
  providerName: string | null;
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

async function listProxyCatalogRows(): Promise<ProxyCatalogRow[]> {
  const rows = await db.select({
    modelName: modelProxyModels.modelName,
    providerName: modelProxyModels.providerName,
    isDefaultProvider: modelProxyModels.isDefaultProvider,
  })
    .from(modelProxyModels)
    .where(eq(modelProxyModels.enabled, true))
    .orderBy(asc(modelProxyModels.modelName), asc(modelProxyModels.providerName));
  return rows;
}

async function listProxyModelNames(
  modelsService: IModelService,
  proxyModels: ProxyCatalogRow[],
): Promise<string[]> {
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
  modelsService: IModelService;
  providerService: IProviderService;
}): Promise<HeboGatewayBuildResult> {
  const providers = await options.providerService.getAll();
  const fallbackModels = await options.modelsService.getAll();
  const proxyCatalogRows = await listProxyCatalogRows();
  const modelNames = await listProxyModelNames(
    options.modelsService,
    proxyCatalogRows,
  );

  const targetsByModel = new Map<string, ResolvedUpstreamTarget>();
  const providerGroups = new Map<string, ProviderGroup>();
  const providerByModel = new Map<string, string>();

  const rowsByBareModel = new Map<string, ProxyCatalogRow[]>();
  for (const row of proxyCatalogRows) {
    const existingRows = rowsByBareModel.get(row.modelName) ?? [];
    existingRows.push(row);
    rowsByBareModel.set(row.modelName, existingRows);
  }

  for (const modelName of modelNames) {
    let target: ResolvedUpstreamTarget;
    try {
      target = await resolveUpstreamTarget({
        modelName,
        providers,
        fallbackModels,
      });
    } catch {
      continue;
    }

    const { bareModelName, providerPrefix } = parseProviderModel(modelName);
    const matchingRows = rowsByBareModel.get(bareModelName) ?? [];
    const rowCount = matchingRows.length || 1;
    const defaultRows = matchingRows.filter((row) => row.isDefaultProvider);

    const catalogKeys: string[] = [];

    if (rowCount === 1) {
      catalogKeys.push(bareModelName);
    } else {
      catalogKeys.push(modelName);
      if (
        providerPrefix &&
        defaultRows.length === 1 &&
        defaultRows[0]?.providerName === providerPrefix
      ) {
        catalogKeys.push(bareModelName);
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

  for (const [bareModelName, rows] of rowsByBareModel) {
    if (
      rows.length > 1 &&
      !rows.some((row) => row.isDefaultProvider)
    ) {
      console.warn(
        `[hebo] Ambiguous model "${bareModelName}" has ${rows.length} providers but no default - use "provider/${bareModelName}" to specify`,
      );
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
