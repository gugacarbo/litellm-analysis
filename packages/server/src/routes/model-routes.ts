import path from "node:path";
import { serverEnv } from "@lite-llm/config/server";
import {
  getDefaultProvider,
  type ModelRoute,
  providerExists as registryProviderExists,
} from "@lite-llm/llm-config-service";
import type { ModelSpec } from "@lite-llm/models-repository";
import type { Application, Response } from "express";
import {
  fetchOpenRouterModelData,
  listBlockingManualAliases,
  listManualAliasesForTarget,
  listManualModelAliases,
  replaceManualAliasesForTarget,
  retargetManualAliases,
} from "../orchestration";
import {
  findBenchmarkModel,
  getWorkspaceRoot,
  loadBenchmarkDataset,
  loadModelAliases,
  resolveStoragePath,
} from "../orchestration/benchmark-helpers";
import {
  createRegistryModelFromRoute,
  listRegistryModels,
  resolveModelRouteFromBody,
  updateRegistryModelFromRoute,
} from "../orchestration/registry-models-bridge";
import { isRecord, normalizeModelRoute } from "../orchestration/route-params";
import type { DbModelSpecLike, RouteOptions } from "../types/index";
import type {
  BenchmarkComparisonField,
  BenchmarkComparisonResponse,
  NormalizedModelBenchmark,
  OpenRouterModelData,
} from "@lite-llm/contracts/benchmarks";

type AliasInventory = {
  aliasMap: Map<string, string>;
  managedAliasKeys: Set<string>;
};

type SyncPresenceStatus = "synced" | "config-only" | "registry-only";

function normalizeAliasValue(value: string): string {
  return value.trim();
}

function normalizeModelNameParam(value: string): string {
  return value.trim();
}

function configSliceFromSpec(spec?: ModelSpec):
  | {
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
    }
  | undefined {
  if (!spec) {
    return undefined;
  }

  return {
    ...(spec.displayName ? { displayName: spec.displayName } : {}),
    ...(spec.family ? { family: spec.family } : {}),
    ...(spec.ownedBy ? { ownedBy: spec.ownedBy } : {}),
    ...(spec.apiMode ? { apiMode: spec.apiMode } : {}),
    ...(typeof spec.vision === "boolean" ? { vision: spec.vision } : {}),
    ...(spec.thinking ? { thinking: spec.thinking } : {}),
    ...(spec.reasoning ? { reasoning: spec.reasoning } : {}),
  };
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

  async function listModelsWithConfig() {
    const [configModels, registryRoutes] = await Promise.all([
      opts.modelsService.getAll(),
      registryModelsService.listRoutes(),
    ]);

    const registryByName = new Map(
      registryRoutes.map((route) => [route.modelName, route]),
    );
    const configNames = new Set(Object.keys(configModels));
    const allNames = Array.from(
      new Set([...configNames, ...registryByName.keys()]),
    ).sort((left, right) => left.localeCompare(right));

    const models = allNames.map((modelName) => {
      const config = configModels[modelName];
      const registryRoute = registryByName.get(modelName);

      let status: SyncPresenceStatus = "synced";
      if (config && !registryRoute) {
        status = "config-only";
      } else if (!config && registryRoute) {
        status = "registry-only";
      }

      return {
        modelName,
        modelRoute: registryRoute ?? { modelName },
        enabled: config?.enabled ?? registryRoute?.enabled ?? true,
        ...(config ? { config: configSliceFromSpec(config) } : {}),
        status,
      };
    });

    const counts = models.reduce(
      (acc, model) => {
        if (model.status === "synced") acc.synced += 1;
        if (model.status === "config-only") acc.configOnly += 1;
        if (model.status === "registry-only") acc.registryOnly += 1;
        acc.total += 1;
        return acc;
      },
      { synced: 0, configOnly: 0, registryOnly: 0, total: 0 },
    );

    return {
      models,
      counts,
      settingsStorage: "database" as const,
    };
  }

  async function getDefaultSettingsDiffPayload() {
    const [defaultProvider, registryRoutes] = await Promise.all([
      getResolvedDefaultProvider(),
      registryModelsService.listRoutes(),
    ]);

    const normalizedDefaultProvider = defaultProvider?.trim() ?? "";
    const mismatchedModels = normalizedDefaultProvider
      ? registryRoutes
          .filter((route) => {
            const providerName = route.providerName?.trim();
            return !!providerName && providerName !== normalizedDefaultProvider;
          })
          .map((route) => route.modelName)
          .sort((left, right) => left.localeCompare(right))
      : [];

    return {
      defaultProvider: normalizedDefaultProvider,
      mismatchedModels,
      count: mismatchedModels.length,
    };
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

  app.get("/models/with-config", async (_req, res) => {
    try {
      res.json(await listModelsWithConfig());
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/models/default-settings-diff", async (_req, res) => {
    try {
      res.json(await getDefaultSettingsDiffPayload());
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/models/sync-default-settings", async (_req, res) => {
    try {
      const defaultProvider =
        (await getResolvedDefaultProvider())?.trim() ?? "";
      if (!defaultProvider) {
        res.status(400).json({ error: "Default provider is not configured" });
        return;
      }

      const routes = await registryModelsService.listRoutes();
      const mismatchedRoutes = routes.filter((route) => {
        const providerName = route.providerName?.trim();
        return !!providerName && providerName !== defaultProvider;
      });

      for (const route of mismatchedRoutes) {
        await updateRegistryModelFromRoute(
          registryModelsService,
          route.modelName,
          { ...route, providerName: defaultProvider },
          defaultProvider,
        );
      }

      res.json({
        success: true,
        updated: mismatchedRoutes.length,
        defaultProvider,
      });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/models/export-configs", async (_req, res) => {
    try {
      await opts.orchestration.syncGeneratedArtifacts();
      if (opts.agentsManager) {
        await opts.agentsManager.registry.exportAll();
      }
      res.json({ success: true });
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

  function parsePricingToPerToken(pricingString: string | undefined): number | null {
    if (!pricingString) return null;
    const num = Number.parseFloat(pricingString);
    if (Number.isNaN(num)) return null;
    return num / 1_000_000;
  }

  function buildComparisonFields(
    aaModel: NormalizedModelBenchmark | null,
    orModel: NormalizedModelBenchmark | null,
    orModelData: OpenRouterModelData | null,
    currentConfig: ModelSpec | undefined,
  ): BenchmarkComparisonField[] {
    const fields: BenchmarkComparisonField[] = [];

    const aaSource = "artificial-analysis";
    const orSource = "openrouter";

    fields.push({
      key: "displayName",
      label: "Nome de Exibição",
      currentValue: currentConfig?.displayName ?? null,
      aa: aaModel
        ? { value: aaModel.name, source: aaSource, sourceLabel: "Artificial Analysis" }
        : null,
      openrouter: orModelData
        ? { value: orModelData.name, source: orSource, sourceLabel: "OpenRouter" }
        : null,
    });

    fields.push({
      key: "family",
      label: "Família",
      currentValue: currentConfig?.family ?? null,
      aa: null,
      openrouter: orModelData?.family
        ? { value: orModelData.family, source: orSource, sourceLabel: "OpenRouter" }
        : null,
    });

    fields.push({
      key: "ownedBy",
      label: "Desenvolvedor",
      currentValue: currentConfig?.ownedBy ?? null,
      aa: aaModel
        ? { value: aaModel.creatorName, source: aaSource, sourceLabel: "Artificial Analysis" }
        : null,
      openrouter: orModel
        ? { value: orModel.creatorName, source: orSource, sourceLabel: "OpenRouter" }
        : null,
    });

    fields.push({
      key: "apiMode",
      label: "Modo API",
      currentValue: currentConfig?.apiMode ?? null,
      aa: null,
      openrouter: null,
    });

    fields.push({
      key: "vision",
      label: "Visão",
      currentValue: currentConfig?.vision ?? null,
      aa: null,
      openrouter: orModelData?.capabilities
        ? { value: orModelData.capabilities.supports_vision, source: orSource, sourceLabel: "OpenRouter" }
        : null,
    });

    fields.push({
      key: "contextWindow",
      label: "Janela de Contexto",
      currentValue: currentConfig?.limits?.length ?? null,
      aa: null,
      openrouter: orModelData?.context_length
        ? { value: orModelData.context_length, source: orSource, sourceLabel: "OpenRouter" }
        : null,
    });

    fields.push({
      key: "maxOutputTokens",
      label: "Tokens Máx. de Saída",
      currentValue: currentConfig?.limits?.maxOutput ?? null,
      aa: null,
      openrouter: orModelData?.max_output_tokens
        ? { value: orModelData.max_output_tokens, source: orSource, sourceLabel: "OpenRouter" }
        : null,
    });

    fields.push({
      key: "inputCostPerToken",
      label: "Custo por Token (entrada)",
      currentValue: currentConfig?.cost?.input ?? null,
      aa: aaModel?.priceInput1mTokens != null
        ? { value: aaModel.priceInput1mTokens / 1_000_000, source: aaSource, sourceLabel: "Artificial Analysis" }
        : null,
      openrouter: orModelData?.pricing
        ? (() => {
            const perToken = parsePricingToPerToken(orModelData.pricing.prompt);
            return perToken != null
              ? { value: perToken, source: orSource, sourceLabel: "OpenRouter" }
              : null;
          })()
        : null,
    });

    fields.push({
      key: "outputCostPerToken",
      label: "Custo por Token (saída)",
      currentValue: currentConfig?.cost?.output ?? null,
      aa: aaModel?.priceOutput1mTokens != null
        ? { value: aaModel.priceOutput1mTokens / 1_000_000, source: aaSource, sourceLabel: "Artificial Analysis" }
        : null,
      openrouter: orModelData?.pricing
        ? (() => {
            const perToken = parsePricingToPerToken(orModelData.pricing.completion);
            return perToken != null
              ? { value: perToken, source: orSource, sourceLabel: "OpenRouter" }
              : null;
          })()
        : null,
    });

    return fields;
  }

  app.get("/models/:name/benchmark-comparison", async (req, res) => {
    try {
      const modelName = normalizeModelNameParam(req.params.name);
      if (!modelName) {
        res.status(400).json({ error: "Model name is required." });
        return;
      }

      const workspaceRoot = getWorkspaceRoot();
      const storagePath = resolveStoragePath(
        workspaceRoot,
        serverEnv.STORAGE_PATH,
      );

      const aliases = await loadModelAliases(storagePath);

      let aaModel: NormalizedModelBenchmark | null = null;
      const aaPath = path.join(
        storagePath,
        "benchmarks",
        "artificial-analysis-models.json",
      );
      try {
        const aaDataset = await loadBenchmarkDataset(aaPath);
        aaModel = findBenchmarkModel(modelName, aaDataset.models, aliases);
      } catch (error) {
        console.error(
          "Failed to load AA benchmarks for comparison:",
          error,
        );
      }

      let orModel: NormalizedModelBenchmark | null = null;
      const orPath = path.join(
        storagePath,
        "benchmarks",
        "openrouter-benchmarks.json",
      );
      try {
        const orDataset = await loadBenchmarkDataset(orPath);
        orModel = findBenchmarkModel(modelName, orDataset.models, aliases);
      } catch (error) {
        console.error(
          "Failed to load OpenRouter benchmarks for comparison:",
          error,
        );
      }

      const resolvedName = aliases[modelName] ?? modelName;
      const orModelData = await fetchOpenRouterModelData(resolvedName);

      let currentConfig: ModelSpec | undefined;
      try {
        currentConfig = await opts.modelsService.get(modelName);
      } catch {
        currentConfig = undefined;
      }

      const fields = buildComparisonFields(
        aaModel,
        orModel,
        orModelData,
        currentConfig,
      );

      const response: BenchmarkComparisonResponse = {
        modelName,
        matchedAaModel: aaModel?.name ?? null,
        matchedOpenRouterModel: orModel?.id ?? null,
        fields,
      };

      res.json(response);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
}
