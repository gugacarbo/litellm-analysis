import {
  getDefaultCredential,
  listCredentials,
} from "@lite-llm/model-proxy-registry-service";
import type { Application } from "express";
import type { RouteOptions } from "../types/index";

export function registerCredentialRoutes(
  app: Application,
  opts: RouteOptions,
): void {
  const { registry } = opts;
  const { settingsService, credentialsService, openAiOAuthService } = registry;

  // GET /credentials - List all credentials (registry first, no raw api_key)
  app.get("/credentials", async (_req, res) => {
    try {
      const credentials = await listCredentials(credentialsService);
      res.json(credentials);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // GET /credentials/default - Get default credential (registry first)
  app.get("/credentials/default", async (_req, res) => {
    try {
      const defaultCredential = await getDefaultCredential(settingsService);
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

  app.get("/credentials/openai-oauth", async (_req, res) => {
    try {
      const connection = await openAiOAuthService.getConnectionStatus();
      res.json(connection);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/credentials/openai-oauth/device/start", async (_req, res) => {
    try {
      const result = await openAiOAuthService.startDeviceAuthorization();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/credentials/openai-oauth/device/poll", async (req, res) => {
    try {
      const deviceAuthId =
        typeof req.body?.deviceAuthId === "string"
          ? req.body.deviceAuthId.trim()
          : "";
      const userCode =
        typeof req.body?.userCode === "string" ? req.body.userCode.trim() : "";

      if (!deviceAuthId || !userCode) {
        res.status(400).json({
          error: "deviceAuthId and userCode are required",
        });
        return;
      }

      const result = await openAiOAuthService.pollDeviceAuthorization({
        deviceAuthId,
        userCode,
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.delete("/credentials/openai-oauth", async (_req, res) => {
    try {
      await openAiOAuthService.disconnect();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
}
