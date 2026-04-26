import type { AnalyticsDataSource } from "@lite-llm/analytics/types";
import type { Application } from "express";

function parseDays(rawValue: unknown, fallback: number): number {
  if (typeof rawValue !== "string") {
    return fallback;
  }

  const parsed = Number.parseInt(rawValue, 10);
  if (Number.isNaN(parsed) || parsed < 0) {
    return fallback;
  }
  return parsed;
}

export function registerSpendRoutes(
  app: Application,
  dataSource: AnalyticsDataSource,
) {
  // Spend by model
  app.get("/spend/model", async (req, res) => {
    try {
      const days = parseDays(req.query.days, 30);
      const data = await dataSource.getSpendByModel(days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // Spend logs count
  app.get("/spend/logs/count", async (req, res) => {
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

  // Spend logs
  app.get("/spend/logs", async (req, res) => {
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

  // Spend by user
  app.get("/spend/user", async (req, res) => {
    try {
      const days = parseDays(req.query.days, 30);
      const data = await dataSource.getSpendByUser(days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // Spend by key
  app.get("/spend/key", async (req, res) => {
    try {
      const days = parseDays(req.query.days, 30);
      const data = await dataSource.getSpendByKey(days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // Spend trend
  app.get("/spend/trend", async (req, res) => {
    try {
      const days = parseDays(req.query.days, 30);
      const data = await dataSource.getDailySpendTrend(days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
}
