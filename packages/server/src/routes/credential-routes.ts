import {
  getDefaultCredentialWithFallback,
  listCredentialsWithFallback,
} from "@lite-llm/model-proxy-registry-service";
import type { Application } from "express";
import type { RouteOptions } from "../types/index";

export function registerCredentialRoutes(
  app: Application,
  opts: RouteOptions,
): void {
  const { registry } = opts;
  const { settingsService, credentialsService } = registry;

  // GET /credentials - List all credentials (registry first, no raw api_key)
  app.get("/credentials", async (_req, res) => {
    try {
      const credentials = await listCredentialsWithFallback(credentialsService);
      res.json(credentials);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // GET /credentials/default - Get default credential (registry first)
  app.get("/credentials/default", async (_req, res) => {
    try {
      const defaultCredential =
        await getDefaultCredentialWithFallback(settingsService);
      res.json({ defaultCredential });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // PUT /credentials/default - Set default credential (registry only)
  app.put("/credentials/default", async (req, res) => {
    try {
      const { credentialAlias } = req.body;
      if (credentialAlias !== null && typeof credentialAlias !== "string") {
        res
          .status(400)
          .json({ error: "credentialAlias must be a string or null" });
        return;
      }

      if (credentialAlias === null || !credentialAlias.trim()) {
        await settingsService.deleteDefaultCredential();
      } else {
        await settingsService.setDefaultCredential(credentialAlias.trim());
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
}
