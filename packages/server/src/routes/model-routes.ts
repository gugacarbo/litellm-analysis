import {
  fromModelRoute,
  getDefaultProvider,
  type ModelRoute,
  type ModelSyncDirection,
  type ModelSyncPresenceStatus,
  normalizeSyncDirection,
  providerExists as registryProviderExists,
  toModelRoute,
} from "@lite-llm/model-proxy-config-service";
import type { Application, Response } from "express";
import {
  listBlockingManualAliases,
  listManualAliasesForTarget,
  listManualModelAliases,
  replaceManualAliasesForTarget,
  retargetManualAliases,
} from "../orchestration";
import {
  createRegistryModelFromRoute,
  createRegistryModelFromSpec,
  listRegistryModels,
  mergeRegistryModelFromSpec,
  resolveModelRouteFromBody,
  updateRegistryModelFromRoute,
} from "../orchestration/registry-models-bridge";
import {
  buildModelRouteFromSpec,
  getProviderNameFromParams,
  isRecord,
  normalizeModelRoute,
} from "../orchestration/route-params";
import type { DbModelSpecLike, RouteOptions } from "../types/index";

function registryEntryParams(model: {
  modelName: string;
  modelRoute: ModelRoute;
}): Record<string, unknown> {
  return fromModelRoute(model.modelRoute);
}

function buildModelConfigResponse(
  spec: DbModelSpecLike,
): ConfigModelEntry["config"] {
  return {
    displayName: spec.displayName,
    family: spec.family,
    ownedBy: spec.ownedBy,
    thinking: spec.thinking,
    reasoning: spec.reasoning,
    apiMode: spec.apiMode,
    vision: spec.vision,
  };
}

interface ConfigModelEntry {
  modelName: string;
  status: ModelSyncPresenceStatus;
  modelRoute: Record<string, unknown>;
  enabled?: boolean;
  config?: {
    displayName?: string;
    family?: string;
    ownedBy?: string;
    thinking?: { levels: string[] };
    reasoning?: {
      effort?: "low" | "medium" | "high" | "xhigh";
      enableThinking?: boolean;
      includeReasoningInRequest?: boolean;
      apiMode?: string;
    };
    apiMode?: "openai" | "anthropic";
    vision?: boolean;
  };
}

type SyncField =
  | "model_presence"
  | "enabled"
  | "context_window_size"
  | "max_tokens"
  | "input_cost_per_token"
  | "output_cost_per_token";

type SyncDirection = ModelSyncDirection;

type ModelSyncDiffItem = {
  modelName: string;
  field: SyncField;
  configValue: unknown;
  registryValue: unknown;
  defaultDirection: ModelSyncDirection;
};

type AliasInventory = {
  aliasMap: Map<string, string>;
  managedAliasKeys: Set<string>;
};

function valuesAreDifferent(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) !== JSON.stringify(b ?? null);
}

function getConfigFieldValue(
  spec: {
    enabled?: boolean;
    limits: { length: number; maxOutput: number };
    cost?: { input?: number; output?: number };
  },
  field: SyncField,
): unknown {
  if (field === "model_presence") return "present";
  if (field === "enabled") return spec.enabled ?? true;
  if (field === "context_window_size") return spec.limits.length;
  if (field === "max_tokens") return spec.limits.maxOutput;
  if (field === "input_cost_per_token") {
    return spec.cost?.input;
  }
  return spec.cost?.output;
}

function getRouteFieldValue(route: ModelRoute, field: SyncField): unknown {
  if (field === "model_presence") return "present";
  if (field === "enabled") {
    return route.enabled ?? true;
  }
  if (field === "context_window_size") return route.contextWindowSize;
  if (field === "max_tokens") return route.maxOutputTokens;
  if (field === "input_cost_per_token") return route.inputCostPerToken;
  return route.outputCostPerToken;
}

function setRouteFieldValue(
  route: ModelRoute,
  field: SyncField,
  value: unknown,
): ModelRoute {
  if (field === "model_presence") {
    return { ...route };
  }
  const next = { ...route };
  if (field === "enabled") {
    next.enabled = value as boolean | undefined;
    return next;
  }
  if (field === "context_window_size") {
    next.contextWindowSize = value as number | undefined;
    return next;
  }
  if (field === "max_tokens") {
    next.maxOutputTokens = value as number | undefined;
    return next;
  }
  if (field === "input_cost_per_token") {
    next.inputCostPerToken = value as number | undefined;
    return next;
  }
  next.outputCostPerToken = value as number | undefined;
  return next;
}

function normalizeAliasValue(value: string): string {
  return value.trim();
}

function normalizeModelNameParam(value: string): string {
  return value.trim();
}

function readAliasInventory(settings: unknown): AliasInventory {
  const aliasMap = new Map<string, string>();
  const managedAliasKeys = new Set<string>();

  if (!isRecord(settings)) {
    return { aliasMap, managedAliasKeys };
  }

  if (isRecord(settings.model_group_alias)) {
    for (const [alias, target] of Object.entries(settings.model_group_alias)) {
      if (typeof target !== "string") {
        continue;
      }
      const normalizedAlias = normalizeAliasValue(alias);
      const normalizedTarget = target.trim();
      if (!normalizedAlias || !normalizedTarget) {
        continue;
      }
      aliasMap.set(normalizedAlias, normalizedTarget);
    }
  }

  const analyticsMeta = settings.__lite_llm_analytics;
  if (isRecord(analyticsMeta)) {
    const managedKeys = analyticsMeta.managedModelGroupAliasKeys;
    if (Array.isArray(managedKeys)) {
      for (const key of managedKeys) {
        if (typeof key !== "string") {
          continue;
        }
        const normalizedKey = normalizeAliasValue(key);
        if (normalizedKey) {
          managedAliasKeys.add(normalizedKey);
        }
      }
    }
  }

  return { aliasMap, managedAliasKeys };
}

function readAliasListFromBody(body: unknown): string[] {
  if (!isRecord(body) || !Array.isArray(body.aliases)) {
    throw new Error('Request body must include an "aliases" array.');
  }

  const aliases: string[] = [];
  for (const alias of body.aliases) {
    if (typeof alias !== "string") {
      throw new Error("Each alias must be a string.");
    }
    const normalizedAlias = normalizeAliasValue(alias);
    if (!normalizedAlias) {
      throw new Error("Aliases cannot be empty.");
    }
    aliases.push(normalizedAlias);
  }

  return aliases;
}

export function registerModelRoutes(
  app: Application,
  opts: RouteOptions,
): void {
  const { dataSource, registry } = opts;
  const { settingsService, registryModelsService, providersService } = registry;

  async function listMergedRegistryModels() {
    return listRegistryModels(registryModelsService);
  }

  async function getResolvedDefaultProvider(): Promise<string | null> {
    const preferredProvider = await opts.providerService.get("local-proxy");
    const providerDefault = preferredProvider?.defaultProvider?.trim();
    if (providerDefault) {
      return providerDefault;
    }
    return getDefaultProvider(settingsService);
  }

  async function listCanonicalModelNames(): Promise<Set<string>> {
    const models = await listMergedRegistryModels();
    return new Set(models.map((model) => model.modelName));
  }

  async function getAliasInventory(): Promise<AliasInventory> {
    return readAliasInventory(await settingsService.getRouterSettings());
  }

  async function getAliasTargetValidationError(
    modelName: string,
  ): Promise<{ status: number; error: string } | null> {
    const normalizedModelName = normalizeModelNameParam(modelName);
    if (!normalizedModelName) {
      return {
        status: 400,
        error: "Model name is required.",
      };
    }
    const [modelNames, aliasInventory] = await Promise.all([
      listCanonicalModelNames(),
      getAliasInventory(),
    ]);

    if (modelNames.has(normalizedModelName)) {
      return null;
    }

    const aliasTarget = aliasInventory.aliasMap.get(normalizedModelName);
    if (aliasTarget) {
      return {
        status: 400,
        error: `Manual aliases must target a real model name. "${normalizedModelName}" is already an alias for "${aliasTarget}".`,
      };
    }

    return {
      status: 404,
      error: `Model "${normalizedModelName}" not found. Create the target model before assigning manual aliases.`,
    };
  }

  async function getAliasWriteValidationError(
    modelName: string,
    aliases: string[],
  ): Promise<{ status: number; error: string } | null> {
    const targetError = await getAliasTargetValidationError(modelName);
    if (targetError) {
      return targetError;
    }

    const duplicates = Array.from(
      aliases.reduce((acc, alias) => {
        const count = acc.get(alias) ?? 0;
        acc.set(alias, count + 1);
        return acc;
      }, new Map<string, number>()),
    )
      .filter(([, count]) => count > 1)
      .map(([alias]) => alias)
      .sort((left, right) => left.localeCompare(right));

    if (duplicates.length > 0) {
      return {
        status: 400,
        error: `Duplicate aliases are not allowed: ${duplicates.join(", ")}.`,
      };
    }

    const [canonicalModelNames, aliasInventory] = await Promise.all([
      listCanonicalModelNames(),
      getAliasInventory(),
    ]);

    for (const alias of aliases) {
      if (canonicalModelNames.has(alias)) {
        return {
          status: 400,
          error: `Alias "${alias}" matches an existing model name. Choose a name that does not collide with a real model.`,
        };
      }

      if (aliasInventory.managedAliasKeys.has(alias)) {
        return {
          status: 409,
          error: `Alias "${alias}" is managed by generated routing. Remove or rename the managed alias before assigning it manually.`,
        };
      }

      const existingTarget = aliasInventory.aliasMap.get(alias);
      if (existingTarget && existingTarget !== modelName) {
        return {
          status: 409,
          error: `Alias "${alias}" already routes to "${existingTarget}". Remove or retarget that alias before assigning it to "${modelName}".`,
        };
      }
    }

    return null;
  }

  async function getModelRenameValidationError(
    currentName: string,
    nextName: string,
  ): Promise<{ status: number; error: string } | null> {
    const normalizedCurrentName = normalizeModelNameParam(currentName);
    const normalizedNextName = normalizeModelNameParam(nextName);
    if (!normalizedNextName || normalizedNextName === normalizedCurrentName) {
      return null;
    }
    if (!normalizedCurrentName) {
      return {
        status: 400,
        error: "Model name is required.",
      };
    }

    const aliasInventory = await getAliasInventory();
    const aliasTarget = aliasInventory.aliasMap.get(normalizedNextName);
    if (!aliasTarget) {
      return null;
    }

    return {
      status: 409,
      error: `Model name "${normalizedNextName}" collides with alias routing to "${aliasTarget}". Rename or remove that alias before renaming the model.`,
    };
  }

  async function rollbackRenamedRegistryModel(
    previousName: string,
    previousRoute: ModelRoute,
    currentName: string,
    providerName: string | null,
  ): Promise<void> {
    await updateRegistryModelFromRoute(
      registryModelsService,
      currentName,
      previousRoute,
      providerName,
      previousName,
    );
  }

  app.get("/models/providers/:providerId", async (req, res) => {
    try {
      const { providerId } = req.params;
      const provider = await opts.providerService.get(providerId);
      if (!provider) {
        res.status(404).json({ error: `Provider "${providerId}" not found` });
        return;
      }
      res.json(provider);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.put("/models/providers/:providerId", async (req, res) => {
    try {
      const { providerId } = req.params;
      const existing = await opts.providerService.get(providerId);
      if (!existing) {
        res.status(404).json({ error: `Provider "${providerId}" not found` });
        return;
      }

      const updates = req.body as {
        name?: string;
        ownedBy?: string;
        baseUrl?: string;
        apiKey?: string;
        defaultProvider?: string;
      };

      if (
        updates.defaultProvider !== undefined &&
        typeof updates.defaultProvider !== "string"
      ) {
        res.status(400).json({
          error: "defaultProvider must be a string",
        });
        return;
      }

      if (typeof updates.defaultProvider === "string") {
        const normalizedDefaultProvider = updates.defaultProvider.trim();
        if (normalizedDefaultProvider.length > 0) {
          const hasProvider = await registryProviderExists(
            providersService,
            normalizedDefaultProvider,
          );
          if (!hasProvider) {
            res.status(400).json({
              error: `Provider "${normalizedDefaultProvider}" not found`,
            });
            return;
          }
        }
        updates.defaultProvider = normalizedDefaultProvider;
      }

      await opts.providerService.update(providerId, updates);
      const updated = await opts.providerService.get(providerId);
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/models", async (_req, res) => {
    try {
      const data = await listMergedRegistryModels();
      res.json(
        data.map((model) => ({
          modelName: model.modelName,
          modelRoute: model.modelRoute,
        })),
      );
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/models/aliases", async (_req, res) => {
    try {
      const aliases = await listManualModelAliases(settingsService);
      res.json({ aliases });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/models/:name/aliases", async (req, res) => {
    try {
      const modelName = normalizeModelNameParam(req.params.name);
      const validationError = await getAliasTargetValidationError(modelName);
      if (validationError) {
        res
          .status(validationError.status)
          .json({ error: validationError.error });
        return;
      }

      const aliases = await listManualAliasesForTarget(
        settingsService,
        modelName,
      );
      res.json({ modelName, aliases });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.put("/models/:name/aliases", async (req, res) => {
    try {
      const modelName = normalizeModelNameParam(req.params.name);
      const aliases = readAliasListFromBody(req.body);
      const validationError = await getAliasWriteValidationError(
        modelName,
        aliases,
      );
      if (validationError) {
        res
          .status(validationError.status)
          .json({ error: validationError.error });
        return;
      }

      const updated = await replaceManualAliasesForTarget(
        settingsService,
        modelName,
        aliases,
      );
      res.json({ aliases: updated });
    } catch (error) {
      const message = String(error);
      if (
        message === 'Request body must include an "aliases" array.' ||
        message === "Each alias must be a string." ||
        message === "Aliases cannot be empty."
      ) {
        res.status(400).json({ error: message });
        return;
      }
      res.status(500).json({ error: message });
    }
  });

  app.delete("/models/aliases/:alias", async (req, res) => {
    try {
      const alias = normalizeAliasValue(req.params.alias);
      if (!alias) {
        res.status(400).json({ error: "Alias is required." });
        return;
      }

      const [manualAliases, aliasInventory] = await Promise.all([
        listManualModelAliases(settingsService),
        getAliasInventory(),
      ]);
      const manualEntry = manualAliases.find((entry) => entry.alias === alias);

      if (!manualEntry) {
        if (aliasInventory.aliasMap.has(alias)) {
          res.status(409).json({
            error: `Alias "${alias}" is managed by generated routing and cannot be deleted from the manual aliases API.`,
          });
          return;
        }
        res.status(404).json({
          error: `Manual alias "${alias}" not found.`,
        });
        return;
      }

      const remainingAliases = (
        await listManualAliasesForTarget(
          settingsService,
          manualEntry.targetModel,
        )
      ).filter((entryAlias) => entryAlias !== alias);
      await replaceManualAliasesForTarget(
        settingsService,
        manualEntry.targetModel,
        remainingAliases,
      );
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/models/default-settings-diff", async (_req, res) => {
    try {
      const [providerName, litellmModels] = await Promise.all([
        getResolvedDefaultProvider(),
        listMergedRegistryModels(),
      ]);
      const normalizedDefault = providerName?.trim() ?? "";
      const mismatchedModels = litellmModels
        .filter((model) => {
          const params = registryEntryParams(model);
          const modelProvider = getProviderNameFromParams(params) ?? "";
          return modelProvider !== normalizedDefault;
        })
        .map((model) => model.modelName)
        .sort((a, b) => a.localeCompare(b));

      res.json({
        defaultProvider: normalizedDefault,
        mismatchedModels,
        count: mismatchedModels.length,
      });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/models/sync-default-settings", async (_req, res) => {
    try {
      const providerName = await getResolvedDefaultProvider();
      const normalizedDefault = providerName?.trim() ?? "";
      const litellmModels = await listMergedRegistryModels();
      let updated = 0;

      for (const model of litellmModels) {
        const normalizedDefaultProvider = normalizedDefault || undefined;
        if (model.modelRoute.providerName === normalizedDefaultProvider) {
          continue;
        }

        const nextRoute = normalizeModelRoute(
          model.modelName,
          {
            ...model.modelRoute,
            providerName: normalizedDefaultProvider,
          },
          normalizedDefault,
        );
        await updateRegistryModelFromRoute(
          registryModelsService,
          model.modelName,
          nextRoute,
          normalizedDefault,
        );
        updated += 1;
      }

      res.json({
        success: true,
        updated,
        defaultProvider: normalizedDefault,
      });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/model/details", async (_req, res) => {
    try {
      const data = await dataSource.getModelDetails();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/models", async (req, res) => {
    try {
      const { modelName, modelRoute } = req.body;
      const normalizedModelName = String(modelName || "").trim();
      if (!normalizedModelName) {
        res.status(400).json({ error: "modelName is required" });
        return;
      }

      const route = resolveModelRouteFromBody({
        modelRoute,
        modelName: normalizedModelName,
      });
      const providerName = await getResolvedDefaultProvider();
      await createRegistryModelFromRoute(
        registryModelsService,
        normalizedModelName,
        normalizeModelRoute(normalizedModelName, route, providerName),
        providerName,
      );
      res.status(201).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.put("/models/:name", async (req, res) => {
    try {
      const name = normalizeModelNameParam(req.params.name);
      const { modelRoute, modelName, config } = req.body;
      const normalizedNewName =
        typeof modelName === "string" && modelName.trim()
          ? modelName.trim()
          : name;
      const renameValidationError = await getModelRenameValidationError(
        name,
        normalizedNewName,
      );
      if (renameValidationError) {
        res.status(renameValidationError.status).json({
          error: renameValidationError.error,
        });
        return;
      }

      const existingModels = await listMergedRegistryModels();
      const existingModel = existingModels.find(
        (item) => item.modelName === name,
      );
      const existingRoute = existingModel?.modelRoute ?? {
        modelName: name,
      };
      const providerName = await getResolvedDefaultProvider();
      let nextRoute: ModelRoute | undefined;
      let renamedRegistryModel = false;

      if (modelRoute !== undefined || modelName !== undefined) {
        const incomingRoute = resolveModelRouteFromBody({
          modelRoute,
          modelName: normalizedNewName,
        });

        // Config-adjacent display metadata is handled separately from the
        // registry route. Strip it here so it never leaks into requestOptions
        // or the registry-backed routing columns.
        const {
          displayName: _displayName,
          family: _family,
          ownedBy: _ownedBy,
          apiMode: _apiMode,
          vision: _vision,
          ...strippedIncomingRoute
        } = incomingRoute;

        nextRoute = normalizeModelRoute(
          normalizedNewName,
          {
            ...existingRoute,
            ...strippedIncomingRoute,
            modelName: normalizedNewName,
          },
          providerName,
        );

        if (typeof incomingRoute.enabled === "boolean") {
          try {
            await opts.modelsService.update(name, {
              enabled: incomingRoute.enabled,
            });
          } catch (configErr) {
            if (!String(configErr).includes("not found")) {
              throw configErr;
            }
          }
        }
      }

      if (isRecord(config)) {
        const configUpdate: Partial<DbModelSpecLike> = {};
        if (typeof config.displayName === "string") {
          configUpdate.displayName = config.displayName || "";
        }
        if (typeof config.family === "string") {
          configUpdate.family = config.family || undefined;
        }
        if (typeof config.ownedBy === "string") {
          configUpdate.ownedBy = config.ownedBy || undefined;
        }
        if (config.apiMode === "openai" || config.apiMode === "anthropic") {
          configUpdate.apiMode = config.apiMode;
        } else if ("apiMode" in config) {
          configUpdate.apiMode = undefined;
        }
        if (typeof config.vision === "boolean") {
          configUpdate.vision = config.vision;
        }
        if (isRecord(config.thinking)) {
          configUpdate.thinking =
            config.thinking as DbModelSpecLike["thinking"];
        } else if ("thinking" in config) {
          configUpdate.thinking = undefined;
        }
        if (isRecord(config.reasoning)) {
          configUpdate.reasoning =
            config.reasoning as DbModelSpecLike["reasoning"];
        } else if ("reasoning" in config) {
          configUpdate.reasoning = undefined;
        }
        if (Object.keys(configUpdate).length > 0) {
          try {
            await opts.modelsService.update(name, configUpdate);
          } catch (configErr) {
            if (!String(configErr).includes("not found")) {
              throw configErr;
            }
          }
        }
      }

      try {
        if (nextRoute) {
          await updateRegistryModelFromRoute(
            registryModelsService,
            name,
            nextRoute,
            providerName,
            normalizedNewName !== name ? normalizedNewName : undefined,
          );
          renamedRegistryModel = normalizedNewName !== name;
        }
      } catch (dbErr) {
        if (
          !String(dbErr).includes("not found") &&
          !String(dbErr).includes("No row")
        ) {
          throw dbErr;
        }
      }

      if (normalizedNewName !== name) {
        try {
          await retargetManualAliases(settingsService, name, normalizedNewName);
        } catch (aliasErr) {
          if (renamedRegistryModel) {
            await rollbackRenamedRegistryModel(
              name,
              existingRoute,
              normalizedNewName,
              providerName,
            );
          }
          throw aliasErr;
        }
      }

      res.json({ success: true });
    } catch (error) {
      const msg = String(error);
      if (msg.includes("not found") || msg.includes("No row")) {
        res.status(404).json({ error: "Model not found" });
        return;
      }
      res.status(500).json({ error: msg });
    }
  });

  app.post("/models/merge", async (req, res) => {
    const { sourceModel, targetModel } = req.body;
    if (!sourceModel || !targetModel) {
      res
        .status(400)
        .json({ error: "sourceModel and targetModel are required" });
      return;
    }
    try {
      // Spend-log analytics only — does not mutate model_proxy_models.
      await dataSource.mergeModels(sourceModel, targetModel);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/models/sync-from-config", async (_req, res) => {
    try {
      const manager = opts.agentsManager;
      const modelsService = opts.modelsService;
      if (!manager) {
        res.status(500).json({ error: "AgentsManager not configured" });
        return;
      }

      const [configModels, litellmModels] = await Promise.all([
        modelsService.getAll(),
        listMergedRegistryModels(),
      ]);
      const providerName = await getResolvedDefaultProvider();

      const configNames = new Set(Object.keys(configModels || {}));
      const litellmNames = new Set(litellmModels.map((m) => m.modelName));

      const litellmByName = new Map(
        litellmModels.map((model) => [model.modelName, model]),
      );

      // 1. Push config → registry (create missing, update existing)
      for (const [name, spec] of Object.entries(configModels || {})) {
        const existing = litellmByName.get(name);
        const existingRoute = existing?.modelRoute ?? { modelName: name };
        if (litellmNames.has(name)) {
          await mergeRegistryModelFromSpec(
            registryModelsService,
            name,
            spec,
            providerName,
            existingRoute,
          );
        } else {
          await createRegistryModelFromSpec(
            registryModelsService,
            name,
            spec,
            providerName,
          );
        }
      }

      // 2. Pull registry → compatibility config store for models missing there
      for (const model of litellmModels) {
        if (configNames.has(model.modelName)) continue;

        const inputCost = model.modelRoute.inputCostPerToken;
        const outputCost = model.modelRoute.outputCostPerToken;

        await modelsService.create(model.modelName, {
          enabled: model.modelRoute.enabled ?? true,
          displayName: "",
          limits: {
            length: model.modelRoute.contextWindowSize ?? 200_000,
            maxOutput: model.modelRoute.maxOutputTokens ?? 32_768,
          },
          cost: {
            input: inputCost,
            output: outputCost,
          },
        });
      }

      // 3. Regenerate plugin config files
      await manager.registry.exportAll();

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/models/sync-diff", async (_req, res) => {
    try {
      const configModels = await opts.modelsService.getAll();
      const litellmModels = await listMergedRegistryModels();
      const litellmByName = new Map(
        litellmModels.map((model) => [model.modelName, model]),
      );
      const fields: SyncField[] = [
        "model_presence",
        "enabled",
        "context_window_size",
        "max_tokens",
        "input_cost_per_token",
        "output_cost_per_token",
      ];
      const items: ModelSyncDiffItem[] = [];

      for (const [modelName, configSpec] of Object.entries(configModels)) {
        const litellmModel = litellmByName.get(modelName);
        if (!litellmModel) {
          items.push({
            modelName,
            field: "model_presence",
            configValue: "present",
            registryValue: undefined,
            defaultDirection: "config-to-registry",
          });
          continue;
        }
        for (const field of fields) {
          const configValue = getConfigFieldValue(configSpec, field);
          const registryValue = getRouteFieldValue(
            litellmModel.modelRoute,
            field,
          );
          if (!valuesAreDifferent(configValue, registryValue)) continue;
          items.push({
            modelName,
            field,
            configValue,
            registryValue,
            defaultDirection: "config-to-registry",
          });
        }
      }

      for (const litellmModel of litellmModels) {
        if (configModels[litellmModel.modelName]) continue;
        items.push({
          modelName: litellmModel.modelName,
          field: "model_presence",
          configValue: undefined,
          registryValue: "present",
          defaultDirection: "config-to-registry",
        });
      }

      items.sort(
        (a, b) =>
          a.modelName.localeCompare(b.modelName) ||
          a.field.localeCompare(b.field),
      );
      res.json({ items });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/models/sync-batch", async (req, res) => {
    try {
      const manager = opts.agentsManager;
      if (!manager) {
        res.status(500).json({ error: "AgentsManager not configured" });
        return;
      }
      const body = req.body as {
        selections?: Array<{
          modelName?: string;
          field?: SyncField;
          direction?: SyncDirection;
        }>;
      };
      const selections = Array.isArray(body?.selections) ? body.selections : [];
      const validFields = new Set<SyncField>([
        "model_presence",
        "enabled",
        "context_window_size",
        "max_tokens",
        "input_cost_per_token",
        "output_cost_per_token",
      ]);
      const validDirections = new Set<string>([
        "config-to-registry",
        "registry-to-config",
        "config-to-litellm",
        "litellm-to-config",
      ]);
      for (const selection of selections) {
        if (
          !selection.modelName ||
          !selection.field ||
          !selection.direction ||
          !validFields.has(selection.field) ||
          !validDirections.has(selection.direction)
        ) {
          res.status(400).json({ error: "Invalid sync selection payload" });
          return;
        }
      }

      const [configModels, litellmModels, providerName] = await Promise.all([
        opts.modelsService.getAll(),
        listMergedRegistryModels(),
        getResolvedDefaultProvider(),
      ]);
      const litellmByName = new Map(
        litellmModels.map((model) => [model.modelName, model]),
      );
      const stats = {
        dbCreated: 0,
        dbUpdated: 0,
        dbDeleted: 0,
        configCreated: 0,
        configUpdated: 0,
        configDeleted: 0,
      };

      for (const selection of selections) {
        const modelName = selection.modelName as string;
        const field = selection.field as SyncField;
        const direction = normalizeSyncDirection(
          selection.direction as SyncDirection,
        );

        if (direction === "config-to-registry") {
          const spec = configModels[modelName];
          if (field === "model_presence") {
            const existing = litellmByName.get(modelName);
            if (spec && !existing) {
              const route = buildModelRouteFromSpec(
                modelName,
                spec,
                providerName,
              );
              await createRegistryModelFromRoute(
                registryModelsService,
                modelName,
                route,
                providerName,
              );
              litellmByName.set(modelName, {
                modelName,
                modelRoute: route,
              });
              stats.dbCreated += 1;
            } else if (!spec && existing) {
              await registryModelsService.delete(modelName);
              litellmByName.delete(modelName);
              stats.dbDeleted += 1;
            }
            continue;
          }
          if (!spec) continue;
          const existing = litellmByName.get(modelName);
          if (!existing) {
            const route = buildModelRouteFromSpec(
              modelName,
              spec,
              providerName,
            );
            await createRegistryModelFromRoute(
              registryModelsService,
              modelName,
              route,
              providerName,
            );
            litellmByName.set(modelName, {
              modelName,
              modelRoute: route,
            });
            stats.dbCreated += 1;
            continue;
          }
          const currentRoute = existing.modelRoute;
          const nextRoute = normalizeModelRoute(
            modelName,
            setRouteFieldValue(
              currentRoute,
              field,
              getConfigFieldValue(spec, field),
            ),
            providerName,
          );
          await updateRegistryModelFromRoute(
            registryModelsService,
            modelName,
            nextRoute,
            providerName,
          );
          litellmByName.set(modelName, {
            ...existing,
            modelRoute: nextRoute,
          });
          stats.dbUpdated += 1;
          continue;
        }

        const existing = litellmByName.get(modelName);
        const currentSpec = configModels[modelName];
        if (field === "model_presence") {
          if (!existing && currentSpec) {
            await opts.modelsService.delete(modelName);
            delete configModels[modelName];
            stats.configDeleted += 1;
          }
          if (existing && !currentSpec) {
            const params = registryEntryParams(existing);
            const inputCost = params.input_cost_per_token as number | undefined;
            const outputCost = params.output_cost_per_token as
              | number
              | undefined;
            await opts.modelsService.create(modelName, {
              enabled: true,
              displayName: "",
              limits: {
                length: (params.context_window_size as number) ?? 200_000,
                maxOutput: (params.max_tokens as number) ?? 32_768,
              },
              cost: {
                input: inputCost,
                output: outputCost,
              },
            });
            const refreshed = await opts.modelsService.get(modelName);
            if (refreshed) {
              configModels[modelName] = refreshed;
            }
            stats.configCreated += 1;
          }
          continue;
        }
        if (!existing) continue;
        const params = registryEntryParams(existing);
        if (!currentSpec) {
          const inputCost = params.input_cost_per_token as number | undefined;
          const outputCost = params.output_cost_per_token as number | undefined;
          await opts.modelsService.create(modelName, {
            enabled: true,
            displayName: "",
            limits: {
              length: (params.context_window_size as number) ?? 200_000,
              maxOutput: (params.max_tokens as number) ?? 32_768,
            },
            cost: {
              input: inputCost,
              output: outputCost,
            },
          });
          const refreshed = await opts.modelsService.get(modelName);
          if (refreshed) {
            configModels[modelName] = refreshed;
          }
          stats.configCreated += 1;
        }

        const spec = configModels[modelName];
        if (!spec) continue;
        if (field === "enabled") {
          await opts.modelsService.update(modelName, {
            enabled: ((params.enabled as boolean | undefined) ??
              true) as boolean,
          });
          stats.configUpdated += 1;
        } else if (field === "context_window_size") {
          await opts.modelsService.update(modelName, {
            limits: {
              ...spec.limits,
              length:
                (params.context_window_size as number) ?? spec.limits.length,
            },
          });
          stats.configUpdated += 1;
        } else if (field === "max_tokens") {
          await opts.modelsService.update(modelName, {
            limits: {
              ...spec.limits,
              maxOutput: (params.max_tokens as number) ?? spec.limits.maxOutput,
            },
          });
          stats.configUpdated += 1;
        } else if (field === "input_cost_per_token") {
          const value = params.input_cost_per_token as number | undefined;
          await opts.modelsService.update(modelName, {
            cost: {
              ...(spec.cost ?? {}),
              input: value,
            },
          });
          stats.configUpdated += 1;
        } else if (field === "output_cost_per_token") {
          const value = params.output_cost_per_token as number | undefined;
          await opts.modelsService.update(modelName, {
            cost: {
              ...(spec.cost ?? {}),
              output: value,
            },
          });
          stats.configUpdated += 1;
        }
        const refreshed = await opts.modelsService.get(modelName);
        if (refreshed) {
          configModels[modelName] = refreshed;
        }
      }

      await manager.registry.exportAll();
      res.json({ success: true, applied: selections.length, stats });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // ── Unified model list (config + LiteLLM) ──

  app.get("/models/with-config", async (_req, res) => {
    try {
      const manager = opts.agentsManager;
      const modelsService = opts.modelsService;
      if (!manager) {
        res.status(500).json({ error: "AgentsManager not configured" });
        return;
      }

      const [configModels, registryModels] = await Promise.all([
        modelsService.getAll(),
        listMergedRegistryModels(),
      ]);

      const configNames = new Set(Object.keys(configModels || {}));
      const registryNames = new Set(registryModels.map((m) => m.modelName));

      const allNames = new Set([...configNames, ...registryNames]);
      const models: ConfigModelEntry[] = [];

      for (const modelName of allNames) {
        const inConfig = configNames.has(modelName);
        const inRegistry = registryNames.has(modelName);

        let status: ConfigModelEntry["status"];
        let modelRoute: ModelRoute;
        let enabled = true;

        let config: ConfigModelEntry["config"] | undefined;

        if (inConfig && inRegistry) {
          const spec = configModels[modelName];
          status = "synced";
          modelRoute =
            registryModels.find((m) => m.modelName === modelName)?.modelRoute ??
            ({ modelName } as ModelRoute);
          enabled = spec?.enabled ?? true;
          config = buildModelConfigResponse(spec);
        } else if (inConfig) {
          const spec = configModels[modelName];
          status = "config-only";
          modelRoute = toModelRoute(
            {
              context_window_size: spec.limits.length,
              max_tokens: spec.limits.maxOutput,
              input_cost_per_token: spec.cost?.input,
              output_cost_per_token: spec.cost?.output,
            },
            modelName,
          );
          enabled = spec.enabled ?? true;
          config = buildModelConfigResponse(spec);
        } else {
          status = "registry-only";
          modelRoute =
            registryModels.find((m) => m.modelName === modelName)?.modelRoute ??
            ({ modelName } as ModelRoute);
          enabled = modelRoute.enabled ?? true;
        }

        models.push({
          modelName,
          status,
          modelRoute: modelRoute as unknown as Record<string, unknown>,
          enabled,
          config,
        });
      }

      models.sort((a, b) => {
        const order: Record<ModelSyncPresenceStatus, number> = {
          synced: 0,
          "config-only": 0,
          "registry-only": 1,
        };
        return (
          order[a.status] - order[b.status] ||
          a.modelName.localeCompare(b.modelName)
        );
      });

      res.json({
        models,
        counts: {
          synced: models.filter((m) => m.status === "synced").length,
          configOnly: models.filter((m) => m.status === "config-only").length,
          registryOnly: models.filter((m) => m.status === "registry-only")
            .length,
          total: models.length,
        },
      });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/models/export-configs", async (_req, res) => {
    try {
      const manager = opts.agentsManager;
      if (!manager) {
        res.status(500).json({ error: "AgentsManager not configured" });
        return;
      }

      await manager.registry.exportAll();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // ── Add LiteLLM-only model to agents.jsonc ──

  app.post("/models/add-to-config", async (req, res) => {
    try {
      const manager = opts.agentsManager;
      const modelsService = opts.modelsService;
      if (!manager) {
        res.status(500).json({ error: "AgentsManager not configured" });
        return;
      }

      const { modelName } = req.body as { modelName?: string };
      if (!modelName) {
        res.status(400).json({ error: "modelName is required" });
        return;
      }

      const existing = await listMergedRegistryModels();
      const model = existing.find((m) => m.modelName === modelName);
      if (!model) {
        res.status(404).json({
          error: `Model "${modelName}" not found in registry`,
        });
        return;
      }

      // Prevent adding if already in config
      const configModels = await modelsService.getAll();
      if (configModels[modelName]) {
        res.status(409).json({
          error: `Model "${modelName}" already exists in config`,
        });
        return;
      }

      const params = registryEntryParams(model);
      const inputCost = params.input_cost_per_token as number | undefined;
      const outputCost = params.output_cost_per_token as number | undefined;

      await modelsService.create(modelName, {
        enabled: true,
        displayName: "",
        limits: {
          length: (params.context_window_size as number) ?? 200_000,
          maxOutput: (params.max_tokens as number) ?? 32_768,
        },
        cost: {
          input: inputCost,
          output: outputCost,
        },
      });

      await opts.orchestration.syncGeneratedArtifacts();

      res.status(201).json({ success: true });
    } catch (error) {
      const message = String(error);
      if (message.includes("already exists")) {
        res.status(409).json({ error: message });
        return;
      }
      res.status(500).json({ error: message });
    }
  });

  const handleDeleteModelLogs = async (model: string, res: Response) => {
    try {
      await dataSource.deleteModelLogs(model);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  };
  app.delete("/models/logs/:model", async (req, res) => {
    await handleDeleteModelLogs(req.params.model, res);
  });

  app.delete("/models/:name", async (req, res) => {
    try {
      const { name } = req.params;
      const manager = opts.agentsManager;
      if (!manager) {
        res.status(500).json({ error: "AgentsManager not configured" });
        return;
      }
      const blockingAliases = await listBlockingManualAliases(
        settingsService,
        name,
      );
      if (blockingAliases.length > 0) {
        res.status(409).json({
          error: `Cannot delete model "${name}" because manual aliases still point to it: ${blockingAliases.join(", ")}. Remove or retarget those aliases first.`,
        });
        return;
      }
      try {
        await opts.modelsService.delete(name);
      } catch (error) {
        if (!String(error).includes("not found")) {
          throw error;
        }
      }
      await registryModelsService.delete(name);
      await manager.registry.exportAll();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
}
