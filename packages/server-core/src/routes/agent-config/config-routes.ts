import type { AgentConfig, CategoryConfig } from "@litellm/shared";
import type { Application } from "express";
import { buildAliasMapFromDb } from "../../orchestration/index.js";
import type { RouteOptions } from "../../types/index.js";

export function registerConfigRoutes(
  app: Application,
  opts: RouteOptions,
): void {
  const { orchestration } = opts;

  app.get("/agent-config", async (_req, res) => {
    try {
      const { readConfigFile } = await import("@lite-llm/agents-manager");
      const config = await readConfigFile();
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.put("/agent-config", async (req, res) => {
    try {
      const { agents: rawAgents, categories: rawCategories } = req.body;

      const agentsToSave: Record<string, AgentConfig> = {};
      const categoriesToSave: Record<string, CategoryConfig> = {};

      const { resolveConfiguredModels } = await import(
        "@lite-llm/alias-router"
      );
      const existingAliases = await buildAliasMapFromDb();

      if (rawAgents && typeof rawAgents === "object") {
        for (const [key, rawCfg] of Object.entries(
          rawAgents as Record<string, Record<string, unknown>>,
        )) {
          const { actualModel, actualFallbacks } = resolveConfiguredModels(
            key,
            String(rawCfg.model || ""),
            (rawCfg.fallback_models as string[] | undefined) || [],
            existingAliases,
          );

          agentsToSave[key] = {
            ...rawCfg,
            model: actualModel,
            fallback_models: actualFallbacks,
          } as AgentConfig;
        }
      }

      if (rawCategories && typeof rawCategories === "object") {
        for (const [key, rawCfg] of Object.entries(
          rawCategories as Record<string, Record<string, unknown>>,
        )) {
          const { actualModel, actualFallbacks } = resolveConfiguredModels(
            key,
            String(rawCfg.model || ""),
            (rawCfg.fallback_models as string[] | undefined) || [],
            existingAliases,
          );

          categoriesToSave[key] = {
            ...rawCfg,
            model: actualModel,
            fallback_models: actualFallbacks,
          } as CategoryConfig;
        }
      }

      const { writeFullConfig } = await import("@lite-llm/agents-manager");
      await writeFullConfig({
        agents: agentsToSave,
        categories: categoriesToSave,
      });

      await orchestration.syncGeneratedArtifacts();
      await orchestration.regenerateAllAliases();

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
}
