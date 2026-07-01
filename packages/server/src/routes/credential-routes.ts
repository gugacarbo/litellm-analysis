import {
  getDefaultCredential,
  listCredentials,
  toPublicCredential,
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

  // Specific routes MUST be registered before /credentials/:name
  // to avoid Express matching them as :name parameter values

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

  app.get("/credentials/openai-oauth/discover-models", async (_req, res) => {
    try {
      const models = await openAiOAuthService.discoverModels();
      res.json({ models });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/credentials/openai-oauth/test-chat", async (req, res) => {
    try {
      const { model, prompt } = req.body as { model?: string; prompt?: string };
      if (!model || typeof model !== "string" || !model.trim()) {
        res.status(400).json({ error: "model is required" });
        return;
      }
      if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
        res.status(400).json({ error: "prompt is required" });
        return;
      }

      const config = await openAiOAuthService.getAuthenticatedRequestConfig();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30_000);

      try {
        const response = await fetch(`${config.baseUrl}/v1/responses`, {
          method: "POST",
          headers: {
            ...config.headers,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: model.trim(),
            input: prompt.trim(),
            stream: false,
            store: false,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const body = await response.text().catch(() => "");
          res.status(response.status).json({
            error: `ChatGPT API error (${response.status}): ${body.slice(0, 500)}`,
          });
          return;
        }

        const data = (await response.json()) as {
          output?: Array<{ type?: string; content?: string; text?: string }>;
          output_text?: string;
        };
        const content =
          data.output_text ??
          data.output
            ?.filter((o) => o.type === "message")
            .map((o) => o.text ?? o.content ?? "")
            .join("\n") ??
          "No response content";
        res.json({ content });
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // GET /credentials/:name - Get credential by name
  app.get("/credentials/:name", async (req, res) => {
    try {
      const name = String(req.params.name);
      const credential = await credentialsService.get(name);
      if (!credential) {
        res.status(404).json({ error: `Credential "${name}" not found` });
        return;
      }
      res.json(toPublicCredential(credential));
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  // POST /credentials - Create a new credential
  app.post("/credentials", async (req, res) => {
    try {
      const { name, provider, baseUrl, secretRef } = req.body as {
        name?: string;
        provider?: string | null;
        baseUrl?: string | null;
        secretRef?: string;
      };

      if (!name || typeof name !== "string" || !name.trim()) {
        res.status(400).json({ error: "Credential name is required" });
        return;
      }
      if (!secretRef || typeof secretRef !== "string" || !secretRef.trim()) {
        res.status(400).json({
          error: "secretRef (env var name) is required",
        });
        return;
      }

      const created = await credentialsService.create({
        name: name.trim(),
        provider: provider ?? null,
        baseUrl: baseUrl ?? null,
        secretRef: secretRef.trim(),
      });
      res.status(201).json(toPublicCredential(created));
    } catch (error) {
      if (error instanceof Error && error.message.includes("already exists")) {
        res.status(409).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: String(error) });
    }
  });

  // PUT /credentials/:name - Update a credential
  app.put("/credentials/:name", async (req, res) => {
    try {
      const name = String(req.params.name);
      const {
        name: newName,
        provider,
        baseUrl,
        secretRef,
      } = req.body as {
        name?: string;
        provider?: string | null;
        baseUrl?: string | null;
        secretRef?: string;
      };

      if (
        newName !== undefined &&
        (typeof newName !== "string" || !newName.trim())
      ) {
        res
          .status(400)
          .json({ error: "Credential name must be a non-empty string" });
        return;
      }
      if (
        secretRef !== undefined &&
        (typeof secretRef !== "string" || !secretRef.trim())
      ) {
        res.status(400).json({
          error: "secretRef (env var name) must be a non-empty string",
        });
        return;
      }

      const updated = await credentialsService.update(name, {
        ...(newName !== undefined ? { name: newName.trim() } : {}),
        ...(provider !== undefined ? { provider } : {}),
        ...(baseUrl !== undefined ? { baseUrl } : {}),
        ...(secretRef !== undefined ? { secretRef: secretRef.trim() } : {}),
      });
      res.json(toPublicCredential(updated));
    } catch (error) {
      if (
        error instanceof Error &&
        (error.message.includes("not found") ||
          error.message.includes("already exists"))
      ) {
        res.status(404).json({ error: error.message });
        return;
      }
      res.status(500).json({ error: String(error) });
    }
  });

  // DELETE /credentials/:name - Delete a credential
  app.delete("/credentials/:name", async (req, res) => {
    try {
      const name = String(req.params.name);
      const deleted = await credentialsService.delete(name);
      if (!deleted) {
        res.status(404).json({ error: `Credential "${name}" not found` });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });
}
