export type ModelDisplayStatus = "synced" | "config-only" | "registry-only";

export type ModelDisplayCandidate = {
  modelName: string;
  status: ModelDisplayStatus;
  modelRoute: {
    modelName: string;
    providerName?: string;
  };
  enabled?: boolean;
  config?: {
    displayName?: string;
    family?: string;
    ownedBy?: string;
    apiMode?: "openai" | "anthropic";
    vision?: boolean;
    thinking?: { levels?: string[] };
    reasoning?: {
      effort?: "low" | "medium" | "high" | "xhigh";
      enableThinking?: boolean;
      includeReasoningInRequest?: boolean;
      apiMode?: "openai" | "anthropic";
    };
  };
};

export type DisplayModelWithAliases = ModelDisplayCandidate & {
  aliases?: string[];
};

function normalizeAliasLookupPart(value: string | null | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

function parseProviderScopedAlias(modelName: string): {
  providerName: string;
  targetModelName: string;
} | null {
  const slashIndex = modelName.indexOf("/");
  if (slashIndex <= 0 || slashIndex >= modelName.length - 1) {
    return null;
  }

  return {
    providerName: modelName.slice(0, slashIndex).trim(),
    targetModelName: modelName.slice(slashIndex + 1).trim(),
  };
}

export function mergeRegistryModelsWithConfigAliases(
  models: ModelDisplayCandidate[],
): DisplayModelWithAliases[] {
  const registryModels = models
    .filter(
      (model): model is DisplayModelWithAliases =>
        model.status === "synced" || model.status === "registry-only",
    )
    .map((model) => ({ ...model, aliases: [] as string[] }));

  const registryIndex = new Map<string, DisplayModelWithAliases>();
  for (const model of registryModels) {
    const providerName = normalizeAliasLookupPart(
      model.modelRoute.providerName,
    );
    const modelName = normalizeAliasLookupPart(model.modelName);
    registryIndex.set(`${providerName}::${modelName}`, model);
  }

  for (const model of models) {
    if (model.status !== "config-only") {
      continue;
    }

    const parsedAlias = parseProviderScopedAlias(model.modelName);
    if (!parsedAlias) {
      continue;
    }

    const registryModel = registryIndex.get(
      `${normalizeAliasLookupPart(parsedAlias.providerName)}::${normalizeAliasLookupPart(parsedAlias.targetModelName)}`,
    );
    if (!registryModel) {
      continue;
    }

    registryModel.aliases?.push(model.modelName);
  }

  return registryModels.map((model) => ({
    ...model,
    aliases: [...(model.aliases ?? [])].sort((left, right) =>
      left.localeCompare(right),
    ),
  }));
}
