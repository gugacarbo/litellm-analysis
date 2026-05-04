import type { Application } from "express";
import type { RouteOptions } from "../types/index.js";

export function registerCredentialRoutes(
  app: Application,
  opts: RouteOptions,
): void {
  const { dataSource } = opts;

  // GET /credentials - List all credentials
  app.get("/credentials", async (_req, res) => {
    try {
      const credentials = await dataSource.getCredentials();
      res.json(credentials);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // GET /credentials/default - Get default credential
  app.get("/credentials/default", async (_req, res) => {
    try {
      const defaultCredential = await dataSource.getDefaultCredential();
      res.json({ defaultCredential });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // PUT /credentials/default - Set default credential
  app.put("/credentials/default", async (req, res) => {
    try {
      const { credentialAlias } = req.body;
      if (credentialAlias !== null && typeof credentialAlias !== "string") {
        res
          .status(400)
          .json({ error: "credentialAlias must be a string or null" });
        return;
      }
      await dataSource.setDefaultCredential(credentialAlias || null);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
}
