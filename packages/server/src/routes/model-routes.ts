import type { Application, Response } from "express";
import {
  applyRequiredLiteLLMParams,
  buildLiteLLMParams,
  isRecord,
} from "../orchestration/lite-llm-params";
import type { RouteOptions } from "../types/index";

interface ConfigModelEntry {
  modelName: string;
  status: "synced" | "config-only" | "litellm-only";
  litellmParams: Record<string, unknown>;
  enabled?: boolean;
}

type SyncField =
  | "model_presence"
  | "enabled"
  | "context_window_size"
  | "max_tokens"
  | "input_cost_per_token"
  | "output_cost_per_token";

type SyncDirection = "config-to-litellm" | "litellm-to-config";

type ModelSyncDiffItem = {
  modelName: string;
  field: SyncField;
  configValue: unknown;
  litellmValue: unknown;
  defaultDirection: SyncDirection;
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
    return spec.cost?.input != null ? spec.cost.input / 1_000_000 : undefined;
  }
  return spec.cost?.output != null ? spec.cost.output / 1_000_000 : undefined;
}

function getLiteLLMFieldValue(
  params: Record<string, unknown>,
  field: SyncField,
): unknown {
  if (field === "model_presence") return "present";
  if (field === "enabled") {
    return (params.enabled as boolean | undefined) ?? true;
  }
  return params[field];
}

function setLiteLLMFieldValue(
  params: Record<string, unknown>,
  field: SyncField,
  value: unknown,
): Record<string, unknown> {
  if (field === "model_presence") {
    return { ...params };
  }
  const next = { ...params };
  if (value === undefined) {
    delete next[field];
    return next;
  }
  next[field] = value;
  return next;
}

function getCredentialNameFromParams(
  params: Record<string, unknown>,
): string | null {
  const raw = params.litellm_credential_name;
  if (typeof raw !== "string") {
    return null;
  }
  const normalized = raw.trim();
  return normalized.length > 0 ? normalized : null;
}

export function registerModelRoutes(
  app: Application,
  opts: RouteOptions,
): void {
  const { dataSource } = opts;

  async function getResolvedDefaultCredential(): Promise<string | null> {
    const litellmProvider = await opts.providerService.get("litellm");
    const providerDefault = litellmProvider?.defaultCredential?.trim();
    if (providerDefault) {
      return providerDefault;
    }
    return dataSource.getDefaultCredential();
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
        defaultCredential?: string;
      };

      if (
        updates.defaultCredential !== undefined &&
        typeof updates.defaultCredential !== "string"
      ) {
        res.status(400).json({
          error: "defaultCredential must be a string",
        });
        return;
      }

      if (typeof updates.defaultCredential === "string") {
        const normalizedDefaultCredential = updates.defaultCredential.trim();
        if (normalizedDefaultCredential.length > 0) {
          const credentials = await dataSource.getCredentials();
          const credentialExists = credentials.some(
            (credential) =>
              credential.credentialName === normalizedDefaultCredential,
          );
          if (!credentialExists) {
            res.status(400).json({
              error: `Credential "${normalizedDefaultCredential}" not found`,
            });
            return;
          }
        }
        updates.defaultCredential = normalizedDefaultCredential;
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
      const data = await dataSource.getModels();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/models/default-settings-diff", async (_req, res) => {
    try {
      const [credentialName, litellmModels] = await Promise.all([
        getResolvedDefaultCredential(),
        dataSource.getModels(),
      ]);
      const normalizedDefault = credentialName?.trim() ?? "";
      const mismatchedModels = litellmModels
        .filter((model) => {
          const params = isRecord(model.litellmParams)
            ? model.litellmParams
            : {};
          const modelCredential = getCredentialNameFromParams(params) ?? "";
          return modelCredential !== normalizedDefault;
        })
        .map((model) => model.modelName)
        .sort((a, b) => a.localeCompare(b));

      res.json({
        defaultCredential: normalizedDefault,
        mismatchedModels,
        count: mismatchedModels.length,
      });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/models/sync-default-settings", async (_req, res) => {
    try {
      const credentialName = await getResolvedDefaultCredential();
      const normalizedDefault = credentialName?.trim() ?? "";
      const litellmModels = await dataSource.getModels();
      let updated = 0;

      for (const model of litellmModels) {
        const params = isRecord(model.litellmParams) ? model.litellmParams : {};
        const modelCredential = getCredentialNameFromParams(params) ?? "";
        if (modelCredential === normalizedDefault) {
          continue;
        }

        const nextParams: Record<string, unknown> = { ...params };
        if (normalizedDefault) {
          nextParams.litellm_credential_name = normalizedDefault;
        } else {
          delete nextParams.litellm_credential_name;
        }

        const litellmParams = applyRequiredLiteLLMParams(
          model.modelName,
          nextParams,
          normalizedDefault,
        );
        await dataSource.updateModel(model.modelName, { litellmParams });
        updated += 1;
      }

      res.json({
        success: true,
        updated,
        defaultCredential: normalizedDefault,
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
      const { modelName, litellmParams } = req.body;
      const normalizedModelName = String(modelName || "").trim();
      if (!normalizedModelName) {
        res.status(400).json({ error: "modelName is required" });
        return;
      }

      const baseParams = isRecord(litellmParams) ? litellmParams : {};
      const credentialName = await getResolvedDefaultCredential();
      await dataSource.createModel({
        modelName: normalizedModelName,
        litellmParams: applyRequiredLiteLLMParams(
          normalizedModelName,
          baseParams,
          credentialName,
        ),
      });
      res.status(201).json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.put("/models/:name", async (req, res) => {
    try {
      const { name } = req.params;
      const { litellmParams, modelName } = req.body;
      const normalizedNewName =
        typeof modelName === "string" && modelName.trim()
          ? modelName.trim()
          : name;

      const updates: {
        litellmParams?: Record<string, unknown>;
        modelName?: string;
      } = {};

      const existingModels = await dataSource.getModels();
      const existingModel = existingModels.find(
        (item) => item.modelName === name,
      );
      const existingParams = isRecord(existingModel?.litellmParams)
        ? existingModel.litellmParams
        : {};
      const credentialName = await getResolvedDefaultCredential();

      if (litellmParams !== undefined || modelName !== undefined) {
        const incomingParams = isRecord(litellmParams) ? litellmParams : {};
        const mergedParams = {
          ...existingParams,
          ...incomingParams,
        };
        updates.litellmParams = applyRequiredLiteLLMParams(
          normalizedNewName,
          mergedParams,
          credentialName,
        );

        // Also sync enabled to config JSONC
        if (typeof incomingParams.enabled === "boolean") {
          try {
            await opts.modelsService.update(name, {
              enabled: incomingParams.enabled,
            });
          } catch (configErr) {
            // If model doesn't exist in config, that's fine — it may be litellm-only
            if (!String(configErr).includes("not found")) {
              throw configErr;
            }
          }
        }
      }
      if (modelName !== undefined) updates.modelName = normalizedNewName;
      try {
        if (Object.keys(updates).length > 0) {
          await dataSource.updateModel(name, updates);
        }
      } catch (dbErr) {
        // If model doesn't exist in LiteLLM DB, that's fine for config-only models
        if (
          !String(dbErr).includes("not found") &&
          !String(dbErr).includes("No row")
        ) {
          throw dbErr;
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
        dataSource.getModels(),
      ]);
      const credentialName = await getResolvedDefaultCredential();

      const configNames = new Set(Object.keys(configModels || {}));
      const litellmNames = new Set(litellmModels.map((m) => m.modelName));

      // 1. Push config → LiteLLM DB (create missing, update existing)
      for (const [name, spec] of Object.entries(configModels || {})) {
        const litellmParams = buildLiteLLMParams(name, spec, credentialName);
        if (litellmNames.has(name)) {
          await dataSource.updateModel(name, { litellmParams });
        } else {
          await dataSource.createModel({ modelName: name, litellmParams });
        }
      }

      // 2. Pull LiteLLM → config (add missing models to agents.jsonc)
      for (const model of litellmModels) {
        if (configNames.has(model.modelName)) continue;

        const params = isRecord(model.litellmParams) ? model.litellmParams : {};
        const inputCost = params.input_cost_per_token as number | undefined;
        const outputCost = params.output_cost_per_token as number | undefined;

        await modelsService.create(model.modelName, {
          enabled: true,
          displayName: "",
          limits: {
            length: (params.context_window_size as number) ?? 200_000,
            maxOutput: (params.max_tokens as number) ?? 32_768,
          },
          cost: {
            input:
              inputCost != null ? Math.round(inputCost * 1_000_000) : undefined,
            output:
              outputCost != null
                ? Math.round(outputCost * 1_000_000)
                : undefined,
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
      const litellmModels = await dataSource.getModels();
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
            litellmValue: undefined,
            defaultDirection: "config-to-litellm",
          });
          continue;
        }
        const litellmParams = isRecord(litellmModel.litellmParams)
          ? litellmModel.litellmParams
          : {};
        for (const field of fields) {
          const configValue = getConfigFieldValue(configSpec, field);
          const litellmValue = getLiteLLMFieldValue(litellmParams, field);
          if (!valuesAreDifferent(configValue, litellmValue)) continue;
          items.push({
            modelName,
            field,
            configValue,
            litellmValue,
            defaultDirection: "config-to-litellm",
          });
        }
      }

      for (const litellmModel of litellmModels) {
        if (configModels[litellmModel.modelName]) continue;
        items.push({
          modelName: litellmModel.modelName,
          field: "model_presence",
          configValue: undefined,
          litellmValue: "present",
          defaultDirection: "config-to-litellm",
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
      const validDirections = new Set<SyncDirection>([
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

      const [configModels, litellmModels, credentialName] = await Promise.all([
        opts.modelsService.getAll(),
        dataSource.getModels(),
        getResolvedDefaultCredential(),
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
        const direction = selection.direction as SyncDirection;

        if (direction === "config-to-litellm") {
          const spec = configModels[modelName];
          if (field === "model_presence") {
            const existing = litellmByName.get(modelName);
            if (spec && !existing) {
              const litellmParams = buildLiteLLMParams(
                modelName,
                spec,
                credentialName,
              );
              await dataSource.createModel({ modelName, litellmParams });
              litellmByName.set(modelName, { modelName, litellmParams });
              stats.dbCreated += 1;
            } else if (!spec && existing) {
              await dataSource.deleteModel(modelName);
              litellmByName.delete(modelName);
              stats.dbDeleted += 1;
            }
            continue;
          }
          if (!spec) continue;
          const existing = litellmByName.get(modelName);
          if (!existing) {
            const litellmParams = buildLiteLLMParams(
              modelName,
              spec,
              credentialName,
            );
            await dataSource.createModel({ modelName, litellmParams });
            litellmByName.set(modelName, { modelName, litellmParams });
            stats.dbCreated += 1;
            continue;
          }
          const currentParams = isRecord(existing.litellmParams)
            ? existing.litellmParams
            : {};
          const nextParams = setLiteLLMFieldValue(
            currentParams,
            field,
            getConfigFieldValue(spec, field),
          );
          const litellmParams = applyRequiredLiteLLMParams(
            modelName,
            nextParams,
            credentialName,
          );
          await dataSource.updateModel(modelName, { litellmParams });
          litellmByName.set(modelName, { ...existing, litellmParams });
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
            const params = isRecord(existing.litellmParams)
              ? existing.litellmParams
              : {};
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
                input:
                  inputCost != null
                    ? Math.round(inputCost * 1_000_000)
                    : undefined,
                output:
                  outputCost != null
                    ? Math.round(outputCost * 1_000_000)
                    : undefined,
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
        const params = isRecord(existing.litellmParams)
          ? existing.litellmParams
          : {};
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
              input:
                inputCost != null
                  ? Math.round(inputCost * 1_000_000)
                  : undefined,
              output:
                outputCost != null
                  ? Math.round(outputCost * 1_000_000)
                  : undefined,
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
              input: value != null ? Math.round(value * 1_000_000) : undefined,
            },
          });
          stats.configUpdated += 1;
        } else if (field === "output_cost_per_token") {
          const value = params.output_cost_per_token as number | undefined;
          await opts.modelsService.update(modelName, {
            cost: {
              ...(spec.cost ?? {}),
              output: value != null ? Math.round(value * 1_000_000) : undefined,
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

      const [configModels, litellmModels] = await Promise.all([
        modelsService.getAll(),
        dataSource.getModels(),
      ]);

      const configNames = new Set(Object.keys(configModels || {}));
      const litellmNames = new Set(litellmModels.map((m) => m.modelName));

      const allNames = new Set([...configNames, ...litellmNames]);
      const models: ConfigModelEntry[] = [];

      for (const modelName of allNames) {
        const inConfig = configNames.has(modelName);
        const inLiteLLM = litellmNames.has(modelName);

        let status: ConfigModelEntry["status"];
        let litellmParams: Record<string, unknown>;
        let enabled = true;

        if (inConfig && inLiteLLM) {
          const spec = configModels[modelName];
          status = "synced";
          litellmParams =
            litellmModels.find((m) => m.modelName === modelName)
              ?.litellmParams ?? {};
          enabled = spec?.enabled ?? true;
        } else if (inConfig) {
          const spec = configModels[modelName];
          status = "config-only";
          litellmParams = {
            context_window_size: spec.limits.length,
            max_tokens: spec.limits.maxOutput,
            input_cost_per_token:
              spec.cost?.input != null
                ? spec.cost.input / 1_000_000
                : undefined,
            output_cost_per_token:
              spec.cost?.output != null
                ? spec.cost.output / 1_000_000
                : undefined,
          };
          enabled = spec.enabled ?? true;
        } else {
          status = "litellm-only";
          litellmParams =
            litellmModels.find((m) => m.modelName === modelName)
              ?.litellmParams ?? {};
          enabled = (litellmParams.enabled as boolean | undefined) ?? true;
        }

        models.push({ modelName, status, litellmParams, enabled });
      }

      models.sort((a, b) => {
        const order = { synced: 0, "config-only": 0, "litellm-only": 1 };
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
          litellmOnly: models.filter((m) => m.status === "litellm-only").length,
          total: models.length,
        },
      });
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

      const existing = await dataSource.getModels();
      const model = existing.find((m) => m.modelName === modelName);
      if (!model) {
        res.status(404).json({
          error: `Model "${modelName}" not found in LiteLLM`,
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

      const params = isRecord(model.litellmParams) ? model.litellmParams : {};
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
          input:
            inputCost != null ? Math.round(inputCost * 1_000_000) : undefined,
          output:
            outputCost != null ? Math.round(outputCost * 1_000_000) : undefined,
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
      try {
        await opts.modelsService.delete(name);
      } catch (error) {
        if (!String(error).includes("not found")) {
          throw error;
        }
      }
      await manager.registry.exportAll();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
}
