import type { AgentEntry, CategoryEntry } from "@lite-llm/agents-manager";
import { createAgentsManager } from "@lite-llm/agents-manager";
import { resolveConfiguredModels } from "@lite-llm/alias-router";
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
      const { repository } = createAgentsManager();
      const config = await repository.read();
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.put("/agent-config", async (req, res) => {
    try {
      const { agents: rawAgents, categories: rawCategories } = req.body;
      const { services } = createAgentsManager();
      const existingAliases = await buildAliasMapFromDb();

      // Upsert agents
      if (rawAgents && typeof rawAgents === "object") {
        for (const [key, rawCfg] of Object.entries(
          rawAgents as Record<string, Record<string, unknown>>,
        )) {
          const model = String(rawCfg.model || "");
          const fallback_models =
            (rawCfg.fallback_models as string[] | undefined) || [];

          const { actualModel, actualFallbacks } = resolveConfiguredModels(
            key,
            model,
            fallback_models,
            existingAliases,
          );

          // Convert snake_case to camelCase and build AgentEntry
          const agentEntry: AgentEntry = {
            model: actualModel,
            fallbackModels: actualFallbacks,
            description: rawCfg.description as string | undefined,
            color: rawCfg.color as string | undefined,
            disable: rawCfg.disable as boolean | undefined,
            variant: rawCfg.variant as string | undefined,
            category: rawCfg.category as string | undefined,
            skills: rawCfg.skills as string[] | undefined,
            temperature: rawCfg.temperature as number | undefined,
            top_p: rawCfg.top_p as number | undefined,
            prompt: rawCfg.prompt as string | undefined,
            prompt_append: rawCfg.prompt_append as string | undefined,
            tools: rawCfg.tools as Record<string, boolean> | undefined,
            mode: rawCfg.mode as "subagent" | "primary" | "all" | undefined,
            permission: rawCfg.permission as AgentEntry["permission"],
          };

          await services.agents.upsert(key, agentEntry);
        }
      }

      // Upsert categories
      if (rawCategories && typeof rawCategories === "object") {
        for (const [key, rawCfg] of Object.entries(
          rawCategories as Record<string, Record<string, unknown>>,
        )) {
          const model = String(rawCfg.model || "");
          const fallback_models =
            (rawCfg.fallback_models as string[] | undefined) || [];

          const { actualModel, actualFallbacks } = resolveConfiguredModels(
            key,
            model,
            fallback_models,
            existingAliases,
          );

          // Convert snake_case to camelCase and build CategoryEntry
          const categoryEntry: CategoryEntry = {
            model: actualModel,
            fallbackModels: actualFallbacks,
            description: rawCfg.description as string | undefined,
            variant: rawCfg.variant as string | undefined,
            temperature: rawCfg.temperature as number | undefined,
            top_p: rawCfg.top_p as number | undefined,
            maxTokens: rawCfg.maxTokens as number | undefined,
            thinking: rawCfg.thinking as CategoryEntry["thinking"],
            reasoningEffort: rawCfg.reasoningEffort as
              | "low"
              | "medium"
              | "high"
              | "xhigh"
              | undefined,
            textVerbosity: rawCfg.textVerbosity as
              | "low"
              | "medium"
              | "high"
              | undefined,
            tools: rawCfg.tools as Record<string, boolean> | undefined,
            prompt_append: rawCfg.prompt_append as string | undefined,
            is_unstable_agent: rawCfg.is_unstable_agent as boolean | undefined,
          };

          await services.categories.upsert(key, categoryEntry);
        }
      }

      await orchestration.syncGeneratedArtifacts();

      const syncAliases = await services.routing.getSyncAliases();
      if (syncAliases) {
        await orchestration.regenerateAllAliases();
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
}
