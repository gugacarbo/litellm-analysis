import {
  ProvidersRepository,
  SETTING_KEYS,
  SettingsRepository,
} from "@lite-llm/model-proxy-registry-service";
import type { Prisma, PrismaClient } from "@lite-llm/model-proxy-repository";
import type { ModelSpec, Provider } from "@lite-llm/models-repository/schemas";
import { collectAgentReferencedModels, readModelsFile } from "./parse.js";
import type { ImportFlags, ImportSummary } from "./types.js";

function metadataFromModelSpec(
  spec: ModelSpec,
): Record<string, unknown> | null {
  const metadata: Record<string, unknown> = {};
  if (spec.thinking !== undefined) {
    metadata.thinking = spec.thinking;
  }
  if (spec.reasoning !== undefined) {
    metadata.reasoning = spec.reasoning;
  }
  return Object.keys(metadata).length > 0 ? metadata : null;
}

function parseApiKeyToSecretRef(
  apiKey: string | undefined,
  providerName: string,
): string {
  if (apiKey?.trim().startsWith("env:")) {
    const envName = apiKey.trim().slice(4).trim();
    if (envName) {
      return envName;
    }
  }

  return `${providerName.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}_API_KEY`;
}

function resolveProviderField(
  providerKey: string,
  provider: Provider,
): string | null {
  if (provider.adapter) {
    return provider.adapter;
  }
  if (provider.ownedBy) {
    return provider.ownedBy;
  }
  return providerKey;
}

function modelRowFromSpec(
  modelName: string,
  spec: ModelSpec,
): Prisma.ModelProxyModelCreateInput {
  const metadata = metadataFromModelSpec(spec);

  return {
    modelName,
    enabled: spec.enabled ?? true,
    displayName: spec.displayName || modelName,
    family: spec.family ?? null,
    ownedBy: spec.ownedBy ?? null,
    apiMode: spec.apiMode ?? null,
    vision: spec.vision ?? null,
    contextWindowSize: spec.limits.length,
    maxOutputTokens: spec.limits.maxOutput,
    inputCostPerToken: spec.cost?.input ?? null,
    outputCostPerToken: spec.cost?.output ?? null,
    metadata: metadata ? (metadata as Prisma.InputJsonValue) : null,
  };
}

function createStubSpec(modelName: string): ModelSpec {
  return {
    enabled: true,
    displayName: modelName,
    limits: { length: 200000, maxOutput: 32768 },
    cost: { input: 0, output: 0 },
    thinking: { levels: [] },
  };
}

export async function importModelsFromFile(
  prisma: PrismaClient,
  modelsFilePath: string,
  agentsData: {
    agents: Record<string, { model?: string }>;
    categories: Record<string, { model?: string }>;
    globalFallbackModel?: string;
  },
  flags: ImportFlags,
  summary: ImportSummary,
): Promise<void> {
  const modelsConfig = readModelsFile(modelsFilePath);
  const settings = new SettingsRepository(prisma);
  const providers = new ProvidersRepository(prisma);

  const localProxy = modelsConfig.provider["local-proxy"];
  const defaultProviderName = localProxy?.defaultProvider?.trim() ?? "";

  if (defaultProviderName) {
    const existingDefault = await settings.findByKey(
      SETTING_KEYS.DEFAULT_PROVIDER,
    );
    if (existingDefault && !flags.force) {
      summary.settings.skipped += 1;
      console.log(
        `[settings] skipped default_provider (already exists; use --force)`,
      );
    } else if (flags.dryRun) {
      console.log(
        `[settings] dry-run would set default_provider=${defaultProviderName}`,
      );
      if (existingDefault) {
        summary.settings.updated += 1;
      } else {
        summary.settings.inserted += 1;
      }
    } else {
      await settings.upsert(SETTING_KEYS.DEFAULT_PROVIDER, {
        default_provider: defaultProviderName,
      });
      if (existingDefault) {
        summary.settings.updated += 1;
      } else {
        summary.settings.inserted += 1;
      }
      console.log(`[settings] set default_provider=${defaultProviderName}`);
    }
  }

  for (const [providerKey, providerSpec] of Object.entries(
    modelsConfig.provider,
  )) {
    if (providerKey === "local-proxy") {
      continue;
    }

    const providerName = providerSpec.defaultProvider?.trim();
    if (!providerName) {
      summary.warnings.push(
        `Provider "${providerKey}" has no defaultProvider; skipped provider import`,
      );
      continue;
    }

    const secretRef = parseApiKeyToSecretRef(providerSpec.apiKey, providerName);
    const existing = await providers.findByName(providerName);

    if (existing && !flags.force) {
      summary.providers.skipped += 1;
      console.log(`[providers] skipped ${providerName}`);
      continue;
    }

    const providerData = {
      name: providerName,
      provider: resolveProviderField(providerKey, providerSpec),
      baseUrl: providerSpec.baseUrl || null,
      secretRef,
    };

    if (flags.dryRun) {
      console.log(
        `[providers] dry-run would ${existing ? "update" : "insert"} ${providerName} (secret_ref=${secretRef})`,
      );
      if (existing) {
        summary.providers.updated += 1;
      } else {
        summary.providers.inserted += 1;
      }
    } else if (existing) {
      await providers.update(providerName, providerData);
      summary.providers.updated += 1;
      console.log(`[providers] updated ${providerName}`);
    } else {
      await providers.create(providerData);
      summary.providers.inserted += 1;
      console.log(`[providers] inserted ${providerName}`);
    }

    summary.requiredEnvVars.push({
      provider: providerName,
      secretRef,
      action: "set env var before proxy start",
    });
  }

  const referencedModels = collectAgentReferencedModels(
    agentsData.agents,
    agentsData.categories,
    agentsData.globalFallbackModel,
  );

  for (const modelName of referencedModels) {
    if (modelsConfig.models[modelName]) {
      continue;
    }

    const message = `Agent references model "${modelName}" which is missing from models.jsonc`;
    if (flags.createStubs) {
      modelsConfig.models[modelName] = createStubSpec(modelName);
      summary.warnings.push(`${message}; created stub`);
      console.warn(`[models] ${message}; creating stub`);
    } else if (flags.skipMissingModels) {
      summary.warnings.push(message);
      console.warn(`[models] warning: ${message}`);
    } else {
      summary.warnings.push(message);
      console.warn(`[models] warning: ${message} (use --create-stubs)`);
    }
  }

  for (const [modelName, spec] of Object.entries(modelsConfig.models)) {
    const existing = await prisma.modelProxyModel.findUnique({
      where: { modelName },
    });

    if (existing && !flags.force) {
      summary.models.skipped += 1;
      continue;
    }

    const data = modelRowFromSpec(modelName, spec);

    if (flags.dryRun) {
      if (existing) {
        summary.models.updated += 1;
      } else {
        summary.models.inserted += 1;
      }
      continue;
    }

    await prisma.modelProxyModel.upsert({
      where: { modelName },
      create: data,
      update: {
        enabled: data.enabled,
        displayName: data.displayName,
        family: data.family,
        ownedBy: data.ownedBy,
        apiMode: data.apiMode,
        vision: data.vision,
        contextWindowSize: data.contextWindowSize,
        maxOutputTokens: data.maxOutputTokens,
        inputCostPerToken: data.inputCostPerToken,
        outputCostPerToken: data.outputCostPerToken,
        metadata: data.metadata,
      },
    });

    if (existing) {
      summary.models.updated += 1;
    } else {
      summary.models.inserted += 1;
    }
  }

  console.log(
    `[models] ${summary.models.inserted} inserted, ${summary.models.updated} updated, ${summary.models.skipped} skipped`,
  );
}
