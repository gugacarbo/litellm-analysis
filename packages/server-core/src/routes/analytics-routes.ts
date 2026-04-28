import type { Application } from "express";
import { parseDays } from "../orchestration/lite-llm-params.js";
import type { RouteOptions } from "../types/index.js";

export function registerAnalyticsRoutes(
  app: Application,
  opts: RouteOptions,
): void {
  const { dataSource } = opts;

  app.get("/analytics/tokens", async (req, res) => {
    try {
      const days = parseDays(req.query.days, 30);
      const data = await dataSource.getTokenDistribution(days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/analytics/performance", async (req, res) => {
    try {
      const days = parseDays(req.query.days, 30);
      const data = await dataSource.getPerformanceMetrics(days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/analytics/temporal", async (req, res) => {
    try {
      const days = parseDays(req.query.days, 7);
      const data = await dataSource.getHourlyUsagePatterns(days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/analytics/keys", async (req, res) => {
    try {
      const days = parseDays(req.query.days, 30);
      const data = await dataSource.getApiKeyStats(days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/analytics/cost-efficiency", async (req, res) => {
    try {
      const days = parseDays(req.query.days, 30);
      const data = await dataSource.getCostEfficiency(days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/analytics/model-distribution", async (req, res) => {
    try {
      const days = parseDays(req.query.days, 30);
      const data = await dataSource.getModelDistribution(days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/analytics/token-trend", async (req, res) => {
    try {
      const days = parseDays(req.query.days, 30);
      const data = await dataSource.getDailyTokenTrend(days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/analytics/model-stats", async (_req, res) => {
    try {
      const days = parseDays(_req.query.days, 30);
      const data = await dataSource.getModelStatistics(days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/analytics/model-daily-spend", async (req, res) => {
    try {
      const model = String(req.query.model || "");
      if (!model) {
        res.status(400).json({ error: "model is required" });
        return;
      }
      const days = parseDays(req.query.days, 30);
      const data = await dataSource.getDailySpendTrendByModel(model, days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/analytics/model-daily-tokens", async (req, res) => {
    try {
      const model = String(req.query.model || "");
      if (!model) {
        res.status(400).json({ error: "model is required" });
        return;
      }
      const days = parseDays(req.query.days, 30);
      const data = await dataSource.getDailyTokenTrendByModel(model, days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/analytics/model-hourly-usage", async (req, res) => {
    try {
      const model = String(req.query.model || "");
      if (!model) {
        res.status(400).json({ error: "model is required" });
        return;
      }
      const days = parseDays(req.query.days, 7);
      const data = await dataSource.getHourlyUsageByModel(model, days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/analytics/model-latency-trend", async (req, res) => {
    try {
      const model = String(req.query.model || "");
      if (!model) {
        res.status(400).json({ error: "model is required" });
        return;
      }
      const days = parseDays(req.query.days, 30);
      const data = await dataSource.getDailyLatencyTrendByModel(model, days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/analytics/model-error-breakdown", async (req, res) => {
    try {
      const model = String(req.query.model || "");
      if (!model) {
        res.status(400).json({ error: "model is required" });
        return;
      }
      const days = parseDays(req.query.days, 30);
      const data = await dataSource.getErrorBreakdownByModel(model, days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/analytics/model-daily-errors", async (req, res) => {
    try {
      const model = String(req.query.model || "");
      if (!model) {
        res.status(400).json({ error: "model is required" });
        return;
      }
      const days = parseDays(req.query.days, 30);
      const data = await dataSource.getDailyErrorTrendByModel(model, days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/analytics/model-top-users", async (req, res) => {
    try {
      const model = String(req.query.model || "");
      if (!model) {
        res.status(400).json({ error: "model is required" });
        return;
      }
      const days = parseDays(req.query.days, 30);
      const data = await dataSource.getTopUsersByModel(model, days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/analytics/model-top-api-keys", async (req, res) => {
    try {
      const model = String(req.query.model || "");
      if (!model) {
        res.status(400).json({ error: "model is required" });
        return;
      }
      const days = parseDays(req.query.days, 30);
      const data = await dataSource.getTopApiKeysByModel(model, days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/metrics", async (req, res) => {
    try {
      const days = parseDays(req.query.days, 30);
      const data = await dataSource.getMetricsSummary(days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
}
