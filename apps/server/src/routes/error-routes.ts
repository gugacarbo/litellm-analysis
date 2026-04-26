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

export function registerErrorRoutes(
  app: Application,
  dataSource: AnalyticsDataSource,
) {
  app.get("/errors", async (req, res) => {
    if (!dataSource.capabilities.errorLogs) {
      res.status(501).json({
        error: "Error logs are not available in API-only mode",
      });
      return;
    }

    try {
      const limit = req.query.limit
        ? parseInt(req.query.limit as string, 10)
        : 50;
      const days = parseDays(req.query.days, 30);
      const data = await dataSource.getErrorLogs(limit, days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
}
