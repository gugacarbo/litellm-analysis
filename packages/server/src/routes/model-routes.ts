import {
  getDefaultProvider,
  type ModelRoute,
  providerExists as registryProviderExists,
} from "@lite-llm/llm-config-service";
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
  listRegistryModels,
  resolveModelRouteFromBody,
  updateRegistryModelFromRoute,
} from "../orchestration/registry-models-bridge";
import {
  isRecord,
  normalizeModelRoute,
} from "../orchestration/route-params";
import type { DbModelSpecLike, RouteOptions } from "../types/index";

type AliasInventory = {
  aliasMap: Map<string, string>;
  managedAliasKeys: Set<string>;
};

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
}
