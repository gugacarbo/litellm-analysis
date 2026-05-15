import type { Application, NextFunction, Request, Response } from "express";
import { parseDays } from "../orchestration/lite-llm-params";
import type { RouteOptions } from "../types/index";

const modelStore = new WeakMap<Request, { model: string }>();

function getModel(req: Request): string {
  return modelStore.get(req)?.model ?? "";
}

export function registerAnalyticsRoutes(
  app: Application,
  opts: RouteOptions,
): void {
  const { dataSource } = opts;

  function requireModelParam(
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    const model = String(req.query.model || "");
    if (!model) {
      res.status(400).json({ error: "model is required" });
      return;
    }
    modelStore.set(req, { model });
    next();
  }

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

  app.get(
    "/analytics/model-daily-spend",
    requireModelParam,
    async (req, res) => {
      try {
        const model = getModel(req);
        const days = parseDays(req.query.days, 30);
        const data = await dataSource.getDailySpendTrendByModel(model, days);
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: String(error) });
      }
    },
  );

  app.get(
    "/analytics/model-daily-tokens",
    requireModelParam,
    async (req, res) => {
      try {
        const model = getModel(req);
        const days = parseDays(req.query.days, 30);
        const data = await dataSource.getDailyTokenTrendByModel(model, days);
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: String(error) });
      }
    },
  );

  app.get(
    "/analytics/model-hourly-usage",
    requireModelParam,
    async (req, res) => {
      try {
        const model = getModel(req);
        const days = parseDays(req.query.days, 7);
        const data = await dataSource.getHourlyUsageByModel(model, days);
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: String(error) });
      }
    },
  );

  app.get(
    "/analytics/model-latency-trend",
    requireModelParam,
    async (req, res) => {
      try {
        const model = getModel(req);
        const days = parseDays(req.query.days, 30);
        const data = await dataSource.getDailyLatencyTrendByModel(model, days);
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: String(error) });
      }
    },
  );

  app.get(
    "/analytics/model-error-breakdown",
    requireModelParam,
    async (req, res) => {
      try {
        const model = getModel(req);
        const days = parseDays(req.query.days, 30);
        const data = await dataSource.getErrorBreakdownByModel(model, days);
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: String(error) });
      }
    },
  );

  app.get(
    "/analytics/model-daily-errors",
    requireModelParam,
    async (req, res) => {
      try {
        const model = getModel(req);
        const days = parseDays(req.query.days, 30);
        const data = await dataSource.getDailyErrorTrendByModel(model, days);
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: String(error) });
      }
    },
  );

  app.get("/analytics/model-top-users", requireModelParam, async (req, res) => {
    try {
      const model = getModel(req);
      const days = parseDays(req.query.days, 30);
      const data = await dataSource.getTopUsersByModel(model, days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get(
    "/analytics/model-top-api-keys",
    requireModelParam,
    async (req, res) => {
      try {
        const model = getModel(req);
        const days = parseDays(req.query.days, 30);
        const data = await dataSource.getTopApiKeysByModel(model, days);
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: String(error) });
      }
    },
  );

  app.get(
    "/analytics/model-cache-hit-rate",
    requireModelParam,
    async (req, res) => {
      try {
        const model = getModel(req);
        const days = parseDays(req.query.days, 30);
        const data = await dataSource.getCacheHitRateByModel(model, days);
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: String(error) });
      }
    },
  );

  app.get("/analytics/model-ttft", requireModelParam, async (req, res) => {
    try {
      const model = getModel(req);
      const days = parseDays(req.query.days, 30);
      const data = await dataSource.getTTFTPercentilesByModel(model, days);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get(
    "/analytics/model-status-distribution",
    requireModelParam,
    async (req, res) => {
      try {
        const model = getModel(req);
        const days = parseDays(req.query.days, 30);
        const data = await dataSource.getStatusDistributionByModel(model, days);
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: String(error) });
      }
    },
  );

  app.get(
    "/analytics/model-provider-breakdown",
    requireModelParam,
    async (req, res) => {
      try {
        const model = getModel(req);
        const days = parseDays(req.query.days, 30);
        const data = await dataSource.getProviderBreakdownByModel(model, days);
        res.json(data);
      } catch (error) {
        res.status(500).json({ error: String(error) });
      }
    },
  );

  app.get("/metrics", async (req, res) => {
    try {
      const days = parseDays(req.query.days, 30);
      const [metrics, allConfiguredModels] = await Promise.all([
        dataSource.getMetricsSummary(days),
        opts.modelsService.getAll(),
      ]);
      // Filter to only enabled models
      const enabledModels = Object.entries(allConfiguredModels)
        .filter(([, spec]) => spec.enabled !== false)
        .map(([name]) => name);
      // Count only enabled models that have requests in the period
      const enabledModelNames = new Set(enabledModels);
      const activeEnabledModels =
        metrics.distinct_models?.filter((model) =>
          enabledModelNames.has(model as string),
        ) ?? enabledModels.length;
      metrics.active_models = Array.isArray(activeEnabledModels)
        ? activeEnabledModels.length
        : activeEnabledModels;
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
}
