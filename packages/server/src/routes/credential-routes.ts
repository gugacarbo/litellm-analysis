import {
  getDefaultCredential,
  listCredentials,
  resolveCredentialSecret,
  toPublicCredential,
} from "@lite-llm/model-proxy-registry-service";
import type { Application } from "express";
import { createRegistryModelFromRoute } from "../orchestration/registry-models-bridge";
import type { RouteOptions } from "../types/index";

type DiscoveredCredentialModel = {
  id: string;
  ownedBy: string;
  object?: string;
  created?: number;
};

function toDiscoveredModelRoute(
  rawModel: unknown,
  defaults?: {
    credentialName?: string | null;
    upstreamBaseUrl?: string | null;
    provider?: string | null;
  },
) {
  const discovered = toDiscoveredCredentialModel(
    rawModel,
    defaults?.provider ?? "",
  );
  if (!discovered) {
    return null;
  }

  return {
    modelName: discovered.id,
    upstreamModel: discovered.id,
    upstreamBaseUrl: readString(defaults?.upstreamBaseUrl),
    credentialName: readString(defaults?.credentialName),
    ownedBy: discovered.ownedBy || undefined,
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const trimmed = value.trim();
  return trimmed ? trimmed : undefined;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

function buildChatCompletionsUrl(baseUrl: string): string {
  const normalized = normalizeBaseUrl(baseUrl);
  if (normalized.endsWith("/chat/completions")) {
    return normalized;
  }
  if (normalized.endsWith("/v1")) {
    return `${normalized}/chat/completions`;
  }
  return `${normalized}/v1/chat/completions`;
}

function toDiscoveredCredentialModel(
  value: unknown,
  fallbackOwnedBy: string,
): DiscoveredCredentialModel | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = readString(value.id);
  if (!id) {
    return null;
  }

  const ownedBy =
    readString(value.owned_by) ?? readString(value.ownedBy) ?? fallbackOwnedBy;

  return {
    id,
    ownedBy,
    object: readString(value.object),
    created:
      typeof value.created === "number" && Number.isFinite(value.created)
        ? value.created
        : undefined,
  };
}

async function discoverModelsFromCredential(input: {
  apiKey: string | null;
  baseUrl: string | null;
  provider: string | null;
  secretRef: string | null;
}): Promise<DiscoveredCredentialModel[]> {
  const resolvedBaseUrl = readString(input.baseUrl);
  if (!resolvedBaseUrl) {
    throw new Error("Credential must have a baseUrl to discover models");
  }

  const apiKey = resolveCredentialSecret(input);
  if (!apiKey) {
    throw new Error(
      "Credential secret could not be resolved for model discovery",
    );
  }

  const normalizedBaseUrl = normalizeBaseUrl(resolvedBaseUrl);
  const candidateUrls = [
    new URL("/models", `${normalizedBaseUrl}/`).toString(),
  ];
  if (!normalizedBaseUrl.endsWith("/v1")) {
    candidateUrls.push(
      new URL("/v1/models", `${normalizedBaseUrl}/`).toString(),
    );
  }

  let lastFailure: string | null = null;

  for (const url of candidateUrls) {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      lastFailure = `${url} returned ${response.status}: ${body.slice(0, 300)}`;
      if (response.status === 404 && url !== candidateUrls.at(-1)) {
        continue;
      }
      break;
    }

    const payload = (await response.json()) as unknown;
    const rawModels =
      isRecord(payload) && Array.isArray(payload.data)
        ? payload.data
        : Array.isArray(payload)
          ? payload
          : null;

    if (!rawModels) {
      throw new Error(`${url} did not include a data array`);
    }

    return rawModels
      .map((model) => toDiscoveredCredentialModel(model, input.provider ?? ""))
      .filter((model): model is DiscoveredCredentialModel => model !== null);
  }

  throw new Error(lastFailure ?? "Provider model discovery failed");
}

export function registerCredentialRoutes(
  app: Application,
  opts: RouteOptions,
): void {
  const { registry } = opts;
  const {
    settingsService,
    credentialsService,
    openAiOAuthService,
    registryModelsService,
  } = registry;

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

  app.post("/credentials/openai-oauth/register-models", async (req, res) => {
    try {
      const rawModels = Array.isArray(req.body?.models) ? req.body.models : [];
      const registered: string[] = [];
      const skipped: string[] = [];
      const errors: string[] = [];

      for (const rawModel of rawModels) {
        const route = toDiscoveredModelRoute(rawModel, {
          provider: "chatgpt-subscription",
        });
        if (!route) {
          errors.push("Encountered a discovered model without an id");
          continue;
        }
        const modelId = route.modelName;

        try {
          await createRegistryModelFromRoute(
            registryModelsService,
            modelId,
            route,
            null,
          );
          registered.push(modelId);
        } catch (error) {
          if (
            error instanceof Error &&
            error.message.includes("already exists")
          ) {
            skipped.push(modelId);
            continue;
          }
          errors.push(
            `${modelId}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }

      res.json({ registered, skipped, errors });
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

  app.post("/credentials/:name/test-chat", async (req, res) => {
    try {
      const name = String(req.params.name);
      const credential = await credentialsService.get(name);
      if (!credential) {
        res.status(404).json({ error: `Credential "${name}" not found` });
        return;
      }

      const { model, prompt } = req.body as { model?: string; prompt?: string };
      if (!model || typeof model !== "string" || !model.trim()) {
        res.status(400).json({ error: "model is required" });
        return;
      }
      if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
        res.status(400).json({ error: "prompt is required" });
        return;
      }

      const baseUrl = readString(credential.baseUrl);
      if (!baseUrl) {
        res.status(400).json({
          error: "Credential must have a baseUrl to test discovered models",
        });
        return;
      }

      const apiKey = resolveCredentialSecret(credential);
      if (!apiKey) {
        res.status(400).json({
          error: "Credential secret could not be resolved for test request",
        });
        return;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30_000);

      try {
        const response = await fetch(buildChatCompletionsUrl(baseUrl), {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: model.trim(),
            messages: [{ role: "user", content: prompt.trim() }],
            stream: false,
            max_tokens: 64,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const body = await response.text().catch(() => "");
          res.status(response.status).json({
            error: `Provider API error (${response.status}): ${body.slice(0, 500)}`,
          });
          return;
        }

        const data = (await response.json()) as {
          choices?: Array<{
            message?: { content?: string | Array<{ text?: string }> };
          }>;
        };
        const firstContent = data.choices?.[0]?.message?.content;
        const content = Array.isArray(firstContent)
          ? firstContent
              .map((item) =>
                isRecord(item) ? (readString(item.text) ?? "") : "",
              )
              .join("\n")
          : firstContent;

        res.json({ content: content?.trim() || "No response content" });
      } finally {
        clearTimeout(timeout);
      }
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.get("/credentials/:name/discover-models", async (req, res) => {
    try {
      const name = String(req.params.name);
      const credential = await credentialsService.get(name);
      if (!credential) {
        res.status(404).json({ error: `Credential "${name}" not found` });
        return;
      }

      const models = await discoverModelsFromCredential({
        apiKey: credential.apiKey,
        baseUrl: credential.baseUrl,
        provider: credential.provider,
        secretRef: credential.secretRef,
      });

      res.json({ models });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  });

  app.post("/credentials/:name/register-models", async (req, res) => {
    try {
      const name = String(req.params.name);
      const credential = await credentialsService.get(name);
      if (!credential) {
        res.status(404).json({ error: `Credential "${name}" not found` });
        return;
      }

      const baseUrl = readString(credential.baseUrl);
      if (!baseUrl) {
        res.status(400).json({
          error: "Credential must have a baseUrl to register discovered models",
        });
        return;
      }

      const rawModels = Array.isArray(req.body?.models) ? req.body.models : [];
      const registered: string[] = [];
      const skipped: string[] = [];
      const errors: string[] = [];

      for (const rawModel of rawModels) {
        const route = toDiscoveredModelRoute(rawModel, {
          credentialName: credential.name,
          upstreamBaseUrl: baseUrl,
          provider: credential.provider,
        });
        if (!route) {
          errors.push("Encountered a discovered model without an id");
          continue;
        }
        const modelId = route.modelName;

        try {
          await createRegistryModelFromRoute(
            registryModelsService,
            modelId,
            route,
            credential.name,
          );
          registered.push(modelId);
        } catch (error) {
          if (
            error instanceof Error &&
            error.message.includes("already exists")
          ) {
            skipped.push(modelId);
            continue;
          }
          errors.push(
            `${modelId}: ${
              error instanceof Error ? error.message : String(error)
            }`,
          );
        }
      }

      res.json({ registered, skipped, errors });
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
      const { name, provider, baseUrl, apiKey, secretRef } = req.body as {
        name?: string;
        provider?: string | null;
        baseUrl?: string | null;
        apiKey?: string;
        secretRef?: string;
      };

      if (!name || typeof name !== "string" || !name.trim()) {
        res.status(400).json({ error: "Credential name is required" });
        return;
      }
      if (
        (apiKey !== undefined && typeof apiKey !== "string") ||
        (secretRef !== undefined && typeof secretRef !== "string")
      ) {
        res.status(400).json({
          error: "apiKey and secretRef must be strings when provided",
        });
        return;
      }

      if (
        (typeof apiKey !== "string" || !apiKey.trim()) &&
        !secretRef?.trim()
      ) {
        res.status(400).json({
          error: "apiKey or secretRef is required",
        });
        return;
      }

      const created = await credentialsService.create({
        name: name.trim(),
        provider: provider ?? null,
        baseUrl: baseUrl ?? null,
        ...(typeof apiKey === "string" ? { apiKey: apiKey.trim() } : {}),
        ...(secretRef ? { secretRef: secretRef.trim() } : {}),
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
        apiKey,
        secretRef,
      } = req.body as {
        name?: string;
        provider?: string | null;
        baseUrl?: string | null;
        apiKey?: string;
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
        apiKey !== undefined &&
        (typeof apiKey !== "string" || !apiKey.trim())
      ) {
        res.status(400).json({
          error: "apiKey must be a non-empty string",
        });
        return;
      }
      if (
        secretRef !== undefined &&
        (typeof secretRef !== "string" || !secretRef.trim())
      ) {
        res.status(400).json({
          error: "secretRef must be a non-empty string",
        });
        return;
      }

      const updated = await credentialsService.update(name, {
        ...(newName !== undefined ? { name: newName.trim() } : {}),
        ...(provider !== undefined ? { provider } : {}),
        ...(baseUrl !== undefined ? { baseUrl } : {}),
        ...(apiKey !== undefined ? { apiKey: apiKey.trim() } : {}),
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
