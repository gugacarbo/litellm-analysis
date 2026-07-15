import type { Application } from "express";
import type { RouteOptions } from "../types/index";

/**
 * Deprecated Express provider boundary.
 *
 * Provider management moved to the ModelAdmin surface. This legacy server
 * retains only the read endpoint required by older dashboard clients.
 */
export function registerProviderRoutes(
  app: Application,
  opts: RouteOptions,
): void {
  app.get("/providers/default", async (_req, res) => {
    try {
      const defaultProvider = await opts.dataSource.getDefaultProvider();
      res.json({ defaultProvider });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
}
