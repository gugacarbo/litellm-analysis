import { createAgentsManager } from "@lite-llm/agents-manager";
import { resolveConfiguredModels } from "@lite-llm/alias-router";
import { buildAliasMapFromDb } from "../../orchestration/index.js";
export function registerConfigRoutes(app, opts) {
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
        for (const [key, rawCfg] of Object.entries(rawAgents)) {
          const model = String(rawCfg.model || "");
          const fallback_models = rawCfg.fallback_models || [];
          const { actualModel, actualFallbacks } = resolveConfiguredModels(
            key,
            model,
            fallback_models,
            existingAliases,
          );
          // Convert snake_case to camelCase and build AgentEntry
          const agentEntry = {
            model: actualModel,
            fallbackModels: actualFallbacks,
            description: rawCfg.description,
            color: rawCfg.color,
            disable: rawCfg.disable,
            variant: rawCfg.variant,
            category: rawCfg.category,
            skills: rawCfg.skills,
            temperature: rawCfg.temperature,
            top_p: rawCfg.top_p,
            prompt: rawCfg.prompt,
            prompt_append: rawCfg.prompt_append,
            tools: rawCfg.tools,
            mode: rawCfg.mode,
            permission: rawCfg.permission,
          };
          await services.agents.upsert(key, agentEntry);
        }
      }
      // Upsert categories
      if (rawCategories && typeof rawCategories === "object") {
        for (const [key, rawCfg] of Object.entries(rawCategories)) {
          const model = String(rawCfg.model || "");
          const fallback_models = rawCfg.fallback_models || [];
          const { actualModel, actualFallbacks } = resolveConfiguredModels(
            key,
            model,
            fallback_models,
            existingAliases,
          );
          // Convert snake_case to camelCase and build CategoryEntry
          const categoryEntry = {
            model: actualModel,
            fallbackModels: actualFallbacks,
            description: rawCfg.description,
            variant: rawCfg.variant,
            temperature: rawCfg.temperature,
            top_p: rawCfg.top_p,
            maxTokens: rawCfg.maxTokens,
            thinking: rawCfg.thinking,
            reasoningEffort: rawCfg.reasoningEffort,
            textVerbosity: rawCfg.textVerbosity,
            tools: rawCfg.tools,
            prompt_append: rawCfg.prompt_append,
            is_unstable_agent: rawCfg.is_unstable_agent,
          };
          await services.categories.upsert(key, categoryEntry);
        }
      }
      await orchestration.syncGeneratedArtifacts();
      await orchestration.regenerateAllAliases();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
}
