import express, { type Application } from 'express';
import type { AnalyticsDataSource } from './data-source/types.js';

export function createApiServer(dataSource: AnalyticsDataSource): Application {
  const app = express();
  app.use(express.json());

  app.get('/mode', (_req, res) => {
    const mode = dataSource.capabilities.errorLogs ? 'database' : 'api-only';
    res.json({
      mode,
      capabilities: dataSource.capabilities,
    });
  });

  app.get('/spend/model', async (_req, res) => {
    try {
      const data = await dataSource.getSpendByModel();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get('/spend/logs/count', async (req, res) => {
    try {
      const { model, user, startDate, endDate } = req.query;
      const count = await dataSource.getSpendLogsCount({
        model: model as string,
        user: user as string,
        startDate: startDate as string,
        endDate: endDate as string,
      });
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get('/spend/logs', async (req, res) => {
    try {
      const { model, user, startDate, endDate, limit, offset } = req.query;
      const data = await dataSource.getSpendLogs({
        model: model as string,
        user: user as string,
        startDate: startDate as string,
        endDate: endDate as string,
        limit: limit ? parseInt(limit as string, 10) : undefined,
        offset: offset ? parseInt(offset as string, 10) : undefined,
      });
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get('/spend/user', async (_req, res) => {
    try {
      const data = await dataSource.getSpendByUser();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get('/spend/key', async (_req, res) => {
    try {
      const data = await dataSource.getSpendByKey();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get('/errors', async (req, res) => {
    if (!dataSource.capabilities.errorLogs) {
      res.status(501).json({
        error: 'Error logs are not available in API-only mode',
      });
      return;
    }

    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const data = await dataSource.getErrorLogs(limit);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get('/metrics', async (_req, res) => {
    try {
      const data = await dataSource.getMetricsSummary();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get('/spend/trend', async (req, res) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
      const data = await dataSource.getDailySpendTrend(days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get('/analytics/tokens', async (_req, res) => {
    try {
      const data = await dataSource.getTokenDistribution();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get('/analytics/performance', async (_req, res) => {
    try {
      const data = await dataSource.getPerformanceMetrics();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get('/analytics/temporal', async (_req, res) => {
    try {
      const data = await dataSource.getHourlyUsagePatterns();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get('/analytics/keys', async (_req, res) => {
    try {
      const data = await dataSource.getApiKeyStats();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get('/analytics/cost-efficiency', async (_req, res) => {
    try {
      const data = await dataSource.getCostEfficiency();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get('/analytics/model-distribution', async (_req, res) => {
    try {
      const data = await dataSource.getModelDistribution();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get('/analytics/token-trend', async (req, res) => {
    try {
      const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
      const data = await dataSource.getDailyTokenTrend(days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get('/analytics/model-stats', async (_req, res) => {
    try {
      const data = await dataSource.getModelStatistics();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get('/models', async (_req, res) => {
    try {
      const data = await dataSource.getModels();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get('/model/details', async (_req, res) => {
    try {
      const data = await dataSource.getModelDetails();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  return app;
}

export default createApiServer;
