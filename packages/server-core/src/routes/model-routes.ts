import type { Application, Response } from "express";
import {
  applyRequiredLiteLLMParams,
  buildLiteLLMParams,
  isRecord,
} from "../orchestration/lite-llm-params.js";
import type { RouteOptions } from "../types/index.js";

interface ConfigModelEntry {
  modelName: string;
  status: "synced" | "config-only" | "litellm-only";
  litellmParams: Record<string, unknown>;
}

export function registerModelRoutes(
  app: Application,
  opts: RouteOptions,
): void {
  const { dataSource } = opts;

  app.get("/models", async (_req, res) => {
    try {
      const data = await dataSource.getModels();
      res.json(data);
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
      await dataSource.createModel({
        modelName: normalizedModelName,
        litellmParams: applyRequiredLiteLLMParams(
          normalizedModelName,
          baseParams,
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

      if (litellmParams !== undefined || modelName !== undefined) {
        const incomingParams = isRecord(litellmParams) ? litellmParams : {};
        const mergedParams = {
          ...existingParams,
          ...incomingParams,
        };
        updates.litellmParams = applyRequiredLiteLLMParams(
          normalizedNewName,
          mergedParams,
        );
      }
      if (modelName !== undefined) updates.modelName = normalizedNewName;
      await dataSource.updateModel(name, updates);
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
      if (!manager) {
        res.status(500).json({ error: "AgentsManager not configured" });
        return;
      }

      const [configModels, litellmModels] = await Promise.all([
        manager.services.models.getAll(),
        dataSource.getModels(),
      ]);

      const configNames = new Set(Object.keys(configModels || {}));
      const litellmNames = new Set(litellmModels.map((m) => m.modelName));

      // 1. Push config → LiteLLM DB (create missing, update existing)
      for (const [name, spec] of Object.entries(configModels || {})) {
        const litellmParams = buildLiteLLMParams(name, spec);
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

        await manager.services.models.create(model.modelName, {
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

  // ── Unified model list (config + LiteLLM) ──

  app.get("/models/with-config", async (_req, res) => {
    try {
      const manager = opts.agentsManager;
      if (!manager) {
        res.status(500).json({ error: "AgentsManager not configured" });
        return;
      }

      const [configModels, litellmModels] = await Promise.all([
        manager.services.models.getAll(),
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

        if (inConfig && inLiteLLM) {
          status = "synced";
          litellmParams =
            litellmModels.find((m) => m.modelName === modelName)
              ?.litellmParams ?? {};
        } else if (inConfig) {
          status = "config-only";
          const spec = configModels[modelName];
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
        } else {
          status = "litellm-only";
          litellmParams =
            litellmModels.find((m) => m.modelName === modelName)
              ?.litellmParams ?? {};
        }

        models.push({ modelName, status, litellmParams });
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
      const configModels = await manager.services.models.getAll();
      if (configModels[modelName]) {
        res.status(409).json({
          error: `Model "${modelName}" already exists in config`,
        });
        return;
      }

      const params = isRecord(model.litellmParams) ? model.litellmParams : {};
      const inputCost = params.input_cost_per_token as number | undefined;
      const outputCost = params.output_cost_per_token as number | undefined;

      await manager.services.models.create(modelName, {
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
      await dataSource.deleteModel(name);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
}
