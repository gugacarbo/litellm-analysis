import type { AnalyticsDataSource } from '@lite-llm/analytics/types';
import type { Application } from 'express';

export function registerAgentRoutingRoutes(app: Application, dataSource: AnalyticsDataSource) {
  app.get('/agent-routing', async (_req, res) => {
    if (!dataSource.capabilities.agentRouting) {
      res
        .status(501)
        .json({ error: 'Agent routing is not available in the current mode' });
      return;
    }
    try {
      const data = await dataSource.getAgentRoutingConfig();
      res.json(data ?? {});
    } catch (error) {
      const errorMsg = String(error).toLowerCase();
      if (
        errorMsg.includes('does not exist') ||
        errorMsg.includes('relation')
      ) {
        res.json({});
        return;
      }
      res.status(500).json({ error: String(error) });
    }
  });

  app.put('/agent-routing', async (req, res) => {
    if (!dataSource.capabilities.agentRouting) {
      res.status(501).json({
        error: 'Agent routing updates are not available in the current mode',
      });
      return;
    }
    try {
      const { model_group_alias } = req.body;

      if (
        !model_group_alias ||
        typeof model_group_alias !== 'object' ||
        Array.isArray(model_group_alias)
      ) {
        res.status(400).json({ error: 'model_group_alias object is required' });
        return;
      }

      for (const [model, alias] of Object.entries(model_group_alias)) {
        if (typeof model !== 'string') {
          res
            .status(400)
            .json({ error: 'model_group_alias keys must be strings' });
          return;
        }
        if (typeof alias !== 'string') {
          res
            .status(400)
            .json({ error: 'model_group_alias values must be strings' });
          return;
        }
      }

      await dataSource.updateAgentRoutingConfig(model_group_alias);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
}
