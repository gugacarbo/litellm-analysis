import type { Application, Request } from "express";
import { parseDays } from "../orchestration/lite-llm-params";
import type { RouteOptions } from "../types/index";

type TimeRangeParams = {
  days?: number;
  startDate?: string;
  endDate?: string;
};

function getTimeRangeParams(
  req: Request,
  defaultDays: number,
): TimeRangeParams {
  const startDate = req.query.startDate as string | undefined;
  const endDate = req.query.endDate as string | undefined;
  if (startDate || endDate) {
    return { startDate, endDate };
  }
  return { days: parseDays(req.query.days, defaultDays) };
}

export function registerSpendRoutes(
  app: Application,
  opts: RouteOptions,
): void {
  const { dataSource } = opts;

  app.get("/spend/model", async (req, res) => {
    try {
      const params = getTimeRangeParams(req as Request, 30);
      const data = await dataSource.getSpendByModel(params);
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

  app.get("/spend/logs/:requestId", async (req, res) => {
    try {
      const { requestId } = req.params;
      if (!requestId) {
        res.status(400).json({ error: "requestId is required" });
        return;
      }
      const data = await dataSource.getSpendLogDetail(requestId);
      res.json(data);
    } catch (error) {
      if (String(error).includes("not found")) {
        res.status(404).json({ error: String(error) });
      } else {
        res.status(500).json({ error: String(error) });
      }
    }
  });

  app.get("/spend/user", async (req, res) => {
    try {
      const params = getTimeRangeParams(req as Request, 30);
      const data = await dataSource.getSpendByUser(params);
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
      const params = getTimeRangeParams(req as Request, 30);
      const data = await dataSource.getDailySpendTrend(params);
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
