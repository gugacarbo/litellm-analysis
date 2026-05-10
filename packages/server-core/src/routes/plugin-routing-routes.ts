import type { Application } from "express";
import type { RouteOptions } from "../types/index.js";

interface PluginInfoDTO {
  id: string;
  name: string;
  enabled: boolean;
  outputFile: string;
  internalAgents: Array<{
    id: string;
    displayName: string;
    description: string;
  }>;
  configSchema: Array<{
    key: string;
    type: string;
    label: string;
    required?: boolean;
    default?: unknown;
    options?: Array<{ value: string; label: string }>;
    placeholder?: string;
    description?: string;
  }>;
  agentCount: number;
  enabledAgentCount: number;
}

export function registerPluginRoutingRoutes(
  app: Application,
  opts: RouteOptions,
): void {
  app.get("/plugin-routing", async (_req, res) => {
    try {
      const manager = opts.agentsManager;
      if (!manager) {
        res.status(500).json({ error: "AgentsManager not configured" });
        return;
      }
      const config = await manager.services.routing.getConfig();
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.put("/plugin-routing", async (req, res) => {
    try {
      const manager = opts.agentsManager;
      if (!manager) {
        res.status(500).json({ error: "AgentsManager not configured" });
        return;
      }
      const config = req.body;

      if (!config || typeof config !== "object") {
        res
          .status(400)
          .json({ error: "PluginRoutingConfig object is required" });
        return;
      }

      await manager.services.routing.saveConfig(config);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.patch("/plugin-routing/:pluginId/agents/:agentId", async (req, res) => {
    try {
      const manager = opts.agentsManager;
      if (!manager) {
        res.status(500).json({ error: "AgentsManager not configured" });
        return;
      }
      const { pluginId, agentId } = req.params;
      const newEnabled = await manager.services.routing.toggleAgentPlugin(
        pluginId,
        agentId,
      );
      res.json({ enabled: newEnabled });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/plugin-routing/plugins", async (_req, res) => {
    try {
      const manager = opts.agentsManager;
      if (!manager) {
        res.status(500).json({ error: "AgentsManager not configured" });
        return;
      }
      const { services, registry } = manager;
      const routing = await services.routing.getConfig();

      const plugins: PluginInfoDTO[] = registry.list().map((p) => {
        const routingPlugin = routing.plugins[p.id];
        const agents = routingPlugin?.agents ?? {};
        const agentEntries = Object.values(agents);

        return {
          id: p.id,
          name: p.name,
          enabled: routingPlugin?.enabled ?? false,
          outputFile: routingPlugin?.outputFile ?? p.getOutputFile(),
          internalAgents: registry.getInternalAgents(p.id),
          configSchema: registry.getConfigSchema(p.id),
          agentCount: Object.keys(agents).length,
          enabledAgentCount: agentEntries.filter((a) => a.enabled).length,
        };
      });

      res.json(plugins);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/plugin-routing/:pluginId/config", async (req, res) => {
    try {
      const manager = opts.agentsManager;
      if (!manager) {
        res.status(500).json({ error: "AgentsManager not configured" });
        return;
      }
      const { pluginId } = req.params;
      const { services, registry } = manager;

      const [config, agentMappings, categoryMappings, schema, internalAgents] =
        await Promise.all([
          services.routing.getPluginConfig(pluginId),
          services.routing.getAgentMappings(pluginId),
          services.routing.getCategoryMappings(pluginId),
          Promise.resolve(registry.getConfigSchema(pluginId)),
          Promise.resolve(registry.getInternalAgents(pluginId)),
        ]);

      res.json({ config, agentMappings, categoryMappings, schema, internalAgents });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.put("/plugin-routing/:pluginId/config", async (req, res) => {
    try {
      const manager = opts.agentsManager;
      if (!manager) {
        res.status(500).json({ error: "AgentsManager not configured" });
        return;
      }
      const { services } = manager;
      const { pluginId } = req.params;
      const { config, agentMappings, categoryMappings } = req.body as {
        config?: Record<string, unknown>;
        agentMappings?: Record<string, string>;
        categoryMappings?: Record<string, boolean>;
      };

      if (config !== undefined) {
        await services.routing.savePluginConfig(pluginId, config);
      }
      if (agentMappings !== undefined) {
        await services.routing.saveAgentMappings(pluginId, agentMappings);
      }
      if (categoryMappings !== undefined) {
        await services.routing.saveCategoryMappings(pluginId, categoryMappings);
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.patch(
    "/plugin-routing/:pluginId/categories/:categoryId",
    async (req, res) => {
      try {
        const manager = opts.agentsManager;
        if (!manager) {
          res.status(500).json({ error: "AgentsManager not configured" });
          return;
        }
        const { services } = manager;
        const { pluginId, categoryId } = req.params;
        const enabled = await services.routing.toggleCategoryMapping(
          pluginId,
          categoryId,
        );
        res.json({ categoryId, enabled });
      } catch (error) {
        res.status(500).json({ error: String(error) });
      }
    },
  );
}
