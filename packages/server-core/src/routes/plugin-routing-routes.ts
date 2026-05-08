import { createAgentsManager } from "@lite-llm/agents-manager";
import type { Application } from "express";

interface PluginInfoDTO {
  id: string;
  name: string;
  builtin: boolean;
  enabled: boolean;
  outputFile: string;
  agentCount: number;
  enabledAgentCount: number;
}

export function registerPluginRoutingRoutes(app: Application): void {
  app.get("/plugin-routing", async (_req, res) => {
    try {
      const { services } = createAgentsManager();
      const config = await services.routing.getConfig();
      res.json(config);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.put("/plugin-routing", async (req, res) => {
    try {
      const { services } = createAgentsManager();
      const config = req.body;

      if (!config || typeof config !== "object") {
        res
          .status(400)
          .json({ error: "PluginRoutingConfig object is required" });
        return;
      }

      await services.routing.saveConfig(config);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.patch("/plugin-routing/:pluginId/agents/:agentId", async (req, res) => {
    try {
      const { services } = createAgentsManager();
      const { pluginId, agentId } = req.params;
      const newEnabled = await services.routing.toggleAgentPlugin(
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
      const { services, registry } = createAgentsManager();
      const routing = await services.routing.getConfig();

      const plugins: PluginInfoDTO[] = registry.list().map((p) => {
        const routingPlugin = routing.plugins[p.id];
        const agents = routingPlugin?.agents ?? {};
        const agentEntries = Object.values(agents);

        return {
          id: p.id,
          name: p.name,
          builtin: p.builtin ?? false,
          enabled: routingPlugin?.enabled ?? false,
          outputFile: routingPlugin?.outputFile ?? p.getOutputFile(),
          agentCount: Object.keys(agents).length,
          enabledAgentCount: agentEntries.filter((a) => a.enabled).length,
        };
      });

      res.json(plugins);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
}
