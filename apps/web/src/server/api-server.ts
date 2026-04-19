import express from 'express';
import {
  getDailySpendTrend,
  getErrorLogs,
  getMetricsSummary,
  getModelDetails,
  getSpendByModel,
  getSpendByKey,
  getSpendByUser,
  getSpendLogs,
  getTokenDistribution,
  getPerformanceMetrics,
  getHourlyUsagePatterns,
  getApiKeyDetailedStats,
  getCostEfficiencyByModel,
  getModelRequestDistribution,
  getDailyTokenTrend,
  getModelStatistics,
  getAllModels,
  createModel,
  updateModel,
  deleteModel,
  mergeModels,
  deleteModelLogs,
} from './db-server.js';

const app = express();
app.use(express.json());

app.get('/spend/model', async (_req, res) => {
  try {
    const data = await getSpendByModel();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/spend/logs', async (req, res) => {
  try {
    const { model, user, startDate, endDate, limit, offset } = req.query;
    const data = await getSpendLogs({
      model: model as string,
      user: user as string,
      startDate: startDate as string,
      endDate: endDate as string,
      limit: limit ? parseInt(limit as string) : undefined,
      offset: offset ? parseInt(offset as string) : undefined,
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/spend/user', async (_req, res) => {
  try {
    const data = await getSpendByUser();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/spend/key', async (_req, res) => {
  try {
    const data = await getSpendByKey();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/model/details', async (_req, res) => {
  try {
    const data = await getModelDetails();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/errors', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
    const data = await getErrorLogs(limit);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/metrics', async (_req, res) => {
  try {
    const data = await getMetricsSummary();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/spend/trend', async (req, res) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    const data = await getDailySpendTrend(days);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/analytics/tokens', async (_req, res) => {
  try {
    const data = await getTokenDistribution();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/analytics/performance', async (_req, res) => {
  try {
    const data = await getPerformanceMetrics();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/analytics/temporal', async (_req, res) => {
  try {
    const data = await getHourlyUsagePatterns();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/analytics/keys', async (_req, res) => {
  try {
    const data = await getApiKeyDetailedStats();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/analytics/cost-efficiency', async (_req, res) => {
  try {
    const data = await getCostEfficiencyByModel();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/analytics/model-distribution', async (_req, res) => {
  try {
    const data = await getModelRequestDistribution();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/analytics/token-trend', async (req, res) => {
  try {
    const days = req.query.days ? parseInt(req.query.days as string) : 30;
    const data = await getDailyTokenTrend(days);
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/analytics/model-stats', async (_req, res) => {
  try {
    const data = await getModelStatistics();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.get('/models', async (_req, res) => {
  try {
    const data = await getAllModels();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/models', async (req, res) => {
  try {
    const { modelName, litellmParams } = req.body;
    if (!modelName) {
      res.status(400).json({ error: 'modelName is required' });
      return;
    }
    await createModel({ modelName, litellmParams: litellmParams || {} });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.put('/models/:name', async (req, res) => {
  try {
    const { name } = req.params;
    const { litellmParams } = req.body;
    await updateModel(name, { litellmParams: litellmParams || {} });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.delete('/models/:name', async (req, res) => {
  try {
    const { name } = req.params;
    await deleteModel(name);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.post('/models/merge', async (req, res) => {
  try {
    const { sourceModel, targetModel } = req.body;
    if (!sourceModel || !targetModel) {
      res.status(400).json({ error: 'sourceModel and targetModel are required' });
      return;
    }
    await mergeModels(sourceModel, targetModel);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

app.delete('/models/logs/:model', async (req, res) => {
  try {
    const { model } = req.params;
    await deleteModelLogs(model);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`API server running on http://localhost:${port}`);
});
