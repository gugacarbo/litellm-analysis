import type { Application } from "express";
import { parseDays } from "../orchestration/lite-llm-params.js";
import type { RouteOptions } from "../types/index.js";

export function registerSpendRoutes(
  app: Application,
  opts: RouteOptions,
): void {
  const { dataSource } = opts;

  app.get("/spend/model", async (req, res) => {
    try {
      const days = parseDays(req.query.days, 30);
      const data = await dataSource.getSpendByModel(days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

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

  app.get("/spend/logs", async (req, res) => {
    try {
      const { model, user, startDate, endDate, limit, offset } = req.query;
      const data = await dataSource.getSpendLogs({
        model: model as string,
        user: user as string,
        startDate: startDate as string,
        endDate: endDate as string,
        limit: limit ? Number.parseInt(limit as string, 10) : undefined,
        offset: offset ? Number.parseInt(offset as string, 10) : undefined,
      });
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/spend/user", async (req, res) => {
    try {
      const days = parseDays(req.query.days, 30);
      const data = await dataSource.getSpendByUser(days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/spend/key", async (req, res) => {
    try {
      const days = parseDays(req.query.days, 30);
      const data = await dataSource.getSpendByKey(days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/spend/trend", async (req, res) => {
    try {
      const days = parseDays(req.query.days, 30);
      const data = await dataSource.getDailySpendTrend(days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/errors", async (req, res) => {
    try {
      const limit = Number.parseInt(req.query.limit as string, 10) || 1000;
      const days = parseDays(req.query.days, 30);
      const data = await dataSource.getErrorLogs(limit, days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
}
