import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRegistryTestStack } from "./helpers/registry-test-stack";

async function createRegistryHttpServer(
  stack = createRegistryTestStack(),
  routes: "models" | "providers" | "proxy" | "all" = "all",
) {
  const express = (await import("express")).default;
  const app = express();
  app.use(express.json());

  if (routes === "models" || routes === "all") {
    const { registerModelRoutes } = await import(
      "../../../../packages/server/src/routes/model-routes.ts"
    );
    registerModelRoutes(app, stack.routeOptions);
  }

  if (routes === "providers" || routes === "all") {
    const { registerProviderRoutes } = await import(
      "../../../../packages/server/src/routes/provider-routes.ts"
    );
    registerProviderRoutes(app, stack.routeOptions);
  }

  if (routes === "proxy" || routes === "all") {
    const { registerModelProxyRoutes } = await import(
      "../../../../packages/server/src/routes/model-proxy-routes.ts"
    );
    registerModelProxyRoutes(app, stack.routeOptions);
  }

  const server = app.listen(0);
  await new Promise<void>((resolve) => {
    server.once("listening", () => resolve());
  });

  const port = (server.address() as AddressInfo).port;
  return { port, server, stack };
}

async function closeServer(server: {
  close: (cb: (error?: Error) => void) => void;
}) {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

describe("registry integration", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.stubEnv("APP_ENCRYPTION_KEY", "01234567890123456789012345678901");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe("settings roundtrip", () => {
    it("persists default provider through provider routes", async () => {
      const { port, server } = await createRegistryHttpServer(
        undefined,
        "providers",
      );

      try {
        const putResponse = await fetch(
          `http://127.0.0.1:${port}/providers/default`,
          {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ providerAlias: "openai-main" }),
          },
        );
        expect(putResponse.status).toBe(200);
        expect(await putResponse.json()).toEqual({ success: true });

        const getResponse = await fetch(
          `http://127.0.0.1:${port}/providers/default`,
        );
        expect(getResponse.status).toBe(200);
        expect(await getResponse.json()).toEqual({
          defaultProvider: "openai-main",
        });

        const clearResponse = await fetch(
          `http://127.0.0.1:${port}/providers/default`,
          {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ providerAlias: null }),
          },
        );
        expect(clearResponse.status).toBe(200);

        const clearedGet = await fetch(
          `http://127.0.0.1:${port}/providers/default`,
        );
        expect(await clearedGet.json()).toEqual({ defaultProvider: null });
      } finally {
        await closeServer(server);
      }
    });

    it("stores raw api keys securely and never returns them in provider responses", async () => {
      const { port, server } = await createRegistryHttpServer(
        undefined,
        "providers",
      );

      try {
        const createResponse = await fetch(
          `http://127.0.0.1:${port}/providers`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              name: "iproute",
              provider: "openai",
              baseUrl: "https://llm.iproute.cloud/v1",
              apiKey: "sk-raw-secret",
            }),
          },
        );
        expect(createResponse.status).toBe(201);
        expect(await createResponse.json()).toEqual(
          expect.objectContaining({
            providerName: "iproute",
            baseUrl: "https://llm.iproute.cloud/v1",
            hasStoredSecret: true,
          }),
        );

        const listResponse = await fetch(`http://127.0.0.1:${port}/providers`);
        expect(listResponse.status).toBe(200);
        expect(await listResponse.json()).toEqual([
          expect.objectContaining({
            providerName: "iproute",
            hasStoredSecret: true,
          }),
        ]);
      } finally {
        await closeServer(server);
      }
    });

    it("exposes OpenAI OAuth connection status routes", async () => {
      const { port, server } = await createRegistryHttpServer(
        undefined,
        "providers",
      );

      try {
        const statusResponse = await fetch(
          `http://127.0.0.1:${port}/providers/openai-oauth`,
        );
        expect(statusResponse.status).toBe(200);
        expect(await statusResponse.json()).toMatchObject({
          connected: false,
          baseUrl: "https://chatgpt.com/backend-api/codex",
        });

        const startResponse = await fetch(
          `http://127.0.0.1:${port}/providers/openai-oauth/device/start`,
          { method: "POST" },
        );
        expect(startResponse.status).toBe(200);
        expect(await startResponse.json()).toMatchObject({
          userCode: "ABCD-1234",
        });

        const registerResponse = await fetch(
          `http://127.0.0.1:${port}/providers/openai-oauth/register-models`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              models: [{ id: "gpt-4.1" }, { id: "gpt-4.1" }],
            }),
          },
        );
        expect(registerResponse.status).toBe(200);
        expect(await registerResponse.json()).toEqual({
          registered: ["gpt-4.1"],
          skipped: ["gpt-4.1"],
          errors: [],
        });
      } finally {
        await closeServer(server);
      }
    });

    it("discovers provider models through saved providers", async () => {
      let receivedAuthorization = "";
      let receivedPath = "";
      const upstreamServer = createServer((req, res) => {
        receivedAuthorization = req.headers.authorization ?? "";
        receivedPath = req.url ?? "";
        if (req.url === "/models") {
          res.statusCode = 404;
          res.end("not found");
          return;
        }
        res.setHeader("content-type", "application/json");
        res.end(
          JSON.stringify({
            data: [{ id: "llama-3.3-70b", owned_by: "groq" }],
          }),
        );
      });

      upstreamServer.listen(0);
      await new Promise<void>((resolve) => {
        upstreamServer.once("listening", () => resolve());
      });

      const upstreamPort = (upstreamServer.address() as AddressInfo).port;
      const stack = createRegistryTestStack();
      await stack.registry.providersService.create({
        name: "groq-main",
        provider: "groq",
        baseUrl: `http://127.0.0.1:${upstreamPort}`,
        apiKey: "secret-123",
      });

      const { port, server } = await createRegistryHttpServer(
        stack,
        "providers",
      );

      try {
        const response = await fetch(
          `http://127.0.0.1:${port}/providers/groq-main/discover-models`,
        );
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
          models: [
            {
              id: "llama-3.3-70b",
              ownedBy: "groq",
            },
          ],
        });
        expect(receivedAuthorization).toBe("Bearer secret-123");
        expect(receivedPath).toBe("/v1/models");
      } finally {
        await closeServer(server);
        await closeServer(upstreamServer);
      }
    });

    it("registers discovered provider models with provider routing", async () => {
      const stack = createRegistryTestStack();
      await stack.registry.providersService.create({
        name: "groq-main",
        provider: "groq",
        baseUrl: "https://api.groq.com/openai/v1",
        apiKey: "sk-groq-test-key",
      });

      const { port, server } = await createRegistryHttpServer(
        stack,
        "providers",
      );

      try {
        const response = await fetch(
          `http://127.0.0.1:${port}/providers/groq-main/register-models`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              models: [
                { id: "llama-3.3-70b", ownedBy: "groq" },
                { id: "llama-3.3-70b", ownedBy: "groq" },
              ],
            }),
          },
        );

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({
          registered: ["llama-3.3-70b"],
          skipped: ["llama-3.3-70b"],
          errors: [],
        });

        const route =
          await stack.registry.registryModelsService.getRoute("llama-3.3-70b");
        expect(route).toMatchObject({
          modelName: "llama-3.3-70b",
          upstreamModel: "llama-3.3-70b",
          upstreamBaseUrl: "https://api.groq.com/openai/v1",
          providerName: "groq-main",
          ownedBy: "groq",
        });
      } finally {
        await closeServer(server);
      }
    });

    it("tests discovered provider models through saved providers", async () => {
      let receivedAuthorization = "";
      let receivedPath = "";
      let receivedBody = "";
      const upstreamServer = createServer((req, res) => {
        receivedAuthorization = req.headers.authorization ?? "";
        receivedPath = req.url ?? "";

        req.setEncoding("utf8");
        req.on("data", (chunk) => {
          receivedBody += chunk;
        });
        req.on("end", () => {
          res.setHeader("content-type", "application/json");
          res.end(
            JSON.stringify({
              choices: [
                {
                  message: {
                    content: "quick ok",
                  },
                },
              ],
            }),
          );
        });
      });

      upstreamServer.listen(0);
      await new Promise<void>((resolve) => {
        upstreamServer.once("listening", () => resolve());
      });

      const upstreamPort = (upstreamServer.address() as AddressInfo).port;
      const stack = createRegistryTestStack();
      await stack.registry.providersService.create({
        name: "groq-main",
        provider: "groq",
        baseUrl: `http://127.0.0.1:${upstreamPort}`,
        apiKey: "secret-123",
      });

      const { port, server } = await createRegistryHttpServer(
        stack,
        "providers",
      );

      try {
        const response = await fetch(
          `http://127.0.0.1:${port}/providers/groq-main/test-chat`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              model: "llama-3.3-70b",
              prompt: "say hi",
            }),
          },
        );

        expect(response.status).toBe(200);
        expect(await response.json()).toEqual({ content: "quick ok" });
        expect(receivedAuthorization).toBe("Bearer secret-123");
        expect(receivedPath).toBe("/v1/chat/completions");
        expect(JSON.parse(receivedBody)).toMatchObject({
          model: "llama-3.3-70b",
          stream: false,
          max_tokens: 64,
          messages: [{ role: "user", content: "say hi" }],
        });
      } finally {
        await closeServer(server);
        await closeServer(upstreamServer);
      }
    });

    it("roundtrips health check prompt and router settings in registry", async () => {
      const stack = createRegistryTestStack();
      const { settingsService } = stack.registry;

      await settingsService.setHealthCheckPrompt("ping from registry");
      expect(await settingsService.getHealthCheckPrompt()).toBe(
        "ping from registry",
      );

      const routerPayload = {
        model_group_alias: { fast: "gpt-fast" },
        __lite_llm_analytics: { managedModelGroupAliasKeys: ["fast"] },
      };
      await settingsService.setRouterSettings(routerPayload);
      expect(await settingsService.getRouterSettings()).toEqual(routerPayload);
    });
  });

  describe("registry model CRUD", () => {
    it("creates, lists, updates, and deletes models through routes", async () => {
      const { port, server, stack } = await createRegistryHttpServer(
        undefined,
        "models",
      );

      try {
        const createResponse = await fetch(`http://127.0.0.1:${port}/models`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            modelName: "gpt-integration",
            modelRoute: {
              modelName: "gpt-integration",
              inputCostPerToken: 0.000001,
              maxOutputTokens: 4096,
            },
          }),
        });
        expect(createResponse.status).toBe(201);

        const listResponse = await fetch(`http://127.0.0.1:${port}/models`);
        expect(listResponse.status).toBe(200);
        const models = (await listResponse.json()) as Array<{
          modelName: string;
          modelRoute: Record<string, unknown>;
        }>;
        expect(models.map((model) => model.modelName)).toContain(
          "gpt-integration",
        );
        expect(
          models.find((model) => model.modelName === "gpt-integration"),
        ).toMatchObject({
          modelRoute: expect.objectContaining({
            maxOutputTokens: 4096,
          }),
        });

        const updateResponse = await fetch(
          `http://127.0.0.1:${port}/models/gpt-integration`,
          {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              modelRoute: { maxOutputTokens: 8192 },
            }),
          },
        );
        expect(updateResponse.status).toBe(200);

        const route =
          await stack.registry.registryModelsService.getRoute(
            "gpt-integration",
          );
        expect(route?.maxOutputTokens).toBe(8192);

        const deleteResponse = await fetch(
          `http://127.0.0.1:${port}/models/gpt-integration`,
          { method: "DELETE" },
        );
        expect(deleteResponse.status).toBe(200);
        expect(
          await stack.registry.registryModelsService.get("gpt-integration"),
        ).toBeNull();
      } finally {
        await closeServer(server);
      }
    });

    it("creates a model when only modelRoute is provided", async () => {
      const { port, server, stack } = await createRegistryHttpServer(
        undefined,
        "models",
      );

      try {
        const createResponse = await fetch(`http://127.0.0.1:${port}/models`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            modelName: "route-only-model",
            modelRoute: {
              maxOutputTokens: 2048,
              inputCostPerToken: 0.000002,
            },
          }),
        });
        expect(createResponse.status).toBe(201);

        const route =
          await stack.registry.registryModelsService.getRoute(
            "route-only-model",
          );
        expect(route?.maxOutputTokens).toBe(2048);
        expect(route?.inputCostPerToken).toBe(0.000002);
      } finally {
        await closeServer(server);
      }
    });

    it("rejects legacy litellmParams in model create request", async () => {
      const { port, server } = await createRegistryHttpServer(
        undefined,
        "models",
      );

      try {
        const response = await fetch(`http://127.0.0.1:${port}/models`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            modelName: "legacy-litellm-model",
            modelRoute: {
              modelName: "legacy-litellm-model",
              litellmParams: { model: "gpt-4" },
            },
          }),
        });
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.error).toMatch(/Unsupported model route fields/);
      } finally {
        await closeServer(server);
      }
    });

    it("rejects snake_case model_name in model create request", async () => {
      const { port, server } = await createRegistryHttpServer(
        undefined,
        "models",
      );

      try {
        const response = await fetch(`http://127.0.0.1:${port}/models`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            modelName: "snake-model",
            modelRoute: {
              model_name: "snake-model",
              input_cost_per_token: 0.000001,
            },
          }),
        });
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.error).toContain(
          "Legacy model route fields are no longer supported",
        );
      } finally {
        await closeServer(server);
      }
    });

    it("rejects legacy model field in model create request", async () => {
      const { port, server } = await createRegistryHttpServer(
        undefined,
        "models",
      );

      try {
        const response = await fetch(`http://127.0.0.1:${port}/models`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            modelName: "legacy-model-field",
            modelRoute: {
              model: "gpt-4",
              modelName: "legacy-model-field",
            },
          }),
        });
        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.error).toContain(
          "Legacy model route fields are no longer supported",
        );
      } finally {
        await closeServer(server);
      }
    });

    it("keeps displayName in config and out of registry requestOptions", async () => {
      const stack = createRegistryTestStack();
      await stack.seedConfigModel("display-name-model");
      await stack.seedRegistryModel("display-name-model");

      const { port, server } = await createRegistryHttpServer(stack, "models");

      try {
        const updateResponse = await fetch(
          `http://127.0.0.1:${port}/models/display-name-model`,
          {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              modelRoute: {
                displayName: "Should be ignored in route",
                inputCostPerToken: 0.000003,
              },
              config: {
                displayName: "GPT Display Name",
                family: "gpt-family",
                ownedBy: "openai",
                apiMode: "openai",
                vision: true,
              },
            }),
          },
        );
        expect(updateResponse.status).toBe(200);

        const configModel = await stack.modelsService.get("display-name-model");
        expect(configModel?.displayName).toBe("GPT Display Name");
        expect(configModel?.family).toBe("gpt-family");
        expect(configModel?.ownedBy).toBe("openai");
        expect(configModel?.apiMode).toBe("openai");
        expect(configModel?.vision).toBe(true);

        const route =
          await stack.registry.registryModelsService.getRoute(
            "display-name-model",
          );
        expect(route?.displayName).toBeUndefined();
        expect(route?.family).toBeUndefined();
        expect(route?.ownedBy).toBeUndefined();
        expect(route?.apiMode).toBeUndefined();
        expect(route?.vision).toBeUndefined();
        expect(route?.inputCostPerToken).toBe(0.000003);
        expect(route?.requestOptions).toBeUndefined();

        const withConfig = await fetch(
          `http://127.0.0.1:${port}/models/with-config`,
        );
        expect(withConfig.status).toBe(200);
        const body = (await withConfig.json()) as {
          models: Array<{
            modelName: string;
            config?: { displayName?: string };
          }>;
        };
        const entry = body.models.find(
          (m) => m.modelName === "display-name-model",
        );
        expect(entry?.config?.displayName).toBe("GPT Display Name");
      } finally {
        await closeServer(server);
      }
    });
  });

  describe("providers", () => {
    it("lists providers without exposing stored secrets", async () => {
      const stack = createRegistryTestStack();
      await stack.registry.providersService.create({
        name: "openai-main",
        provider: "openai",
        baseUrl: "https://api.openai.com/v1",
        apiKey: "sk-openai-test-key",
      });

      const { port, server } = await createRegistryHttpServer(
        stack,
        "providers",
      );

      try {
        const response = await fetch(`http://127.0.0.1:${port}/providers`);
        expect(response.status).toBe(200);

        const body = (await response.json()) as Array<Record<string, unknown>>;
        expect(body).toHaveLength(1);
        expect(body[0]).toMatchObject({
          providerName: "openai-main",
          hasStoredSecret: true,
          provider: "openai",
          baseUrl: "https://api.openai.com/v1",
        });
        expect(body[0]).not.toHaveProperty("secretRef");
        expect(body[0]).not.toHaveProperty("api_key");
        expect(body[0]).not.toHaveProperty("apiKey");
        expect(body[0]).not.toHaveProperty("providerValues");
      } finally {
        await closeServer(server);
      }
    });
  });

  describe("api key auth", () => {
    it("authorizes proxy requests with registry API keys", async () => {
      vi.stubEnv("MODEL_PROXY_API_KEY", "");
      const stack = createRegistryTestStack();
      await stack.registry.apiKeysService.create(
        { label: "integration" },
        "mp_integration_key",
      );

      const { port, server } = await createRegistryHttpServer(stack, "proxy");

      try {
        const unauthorized = await fetch(`http://127.0.0.1:${port}/v1/models`);
        expect(unauthorized.status).toBe(401);

        const authorized = await fetch(`http://127.0.0.1:${port}/v1/models`, {
          headers: { authorization: "Bearer mp_integration_key" },
        });
        expect(authorized.status).toBe(200);
        expect(await authorized.json()).toEqual({ object: "list", data: [] });
      } finally {
        await closeServer(server);
      }
    });

    it("rejects disabled registry API keys", async () => {
      vi.stubEnv("MODEL_PROXY_API_KEY", "");
      const stack = createRegistryTestStack();
      await stack.registry.apiKeysService.create(
        { label: "enabled" },
        "mp_enabled_key",
      );
      const created = await stack.registry.apiKeysService.create(
        { label: "disabled" },
        "mp_disabled_key",
      );
      await stack.registry.apiKeysService.disable(created.record.id);

      const { port, server } = await createRegistryHttpServer(stack, "proxy");

      try {
        const response = await fetch(`http://127.0.0.1:${port}/v1/models`, {
          headers: { authorization: "Bearer mp_disabled_key" },
        });
        expect(response.status).toBe(401);
      } finally {
        await closeServer(server);
      }
    });
  });

  describe("sync states", () => {
    it("reports synced, config-only, and registry-only models", async () => {
      const stack = createRegistryTestStack();
      await stack.seedConfigModel("config-only-model");
      await stack.seedRegistryModel("registry-only-model", {
        displayName: "Registry Only",
      });
      await stack.seedConfigModel("synced-model");
      await stack.seedRegistryModel("synced-model", {
        displayName: "Synced",
      });

      const { port, server } = await createRegistryHttpServer(stack, "models");

      try {
        const response = await fetch(
          `http://127.0.0.1:${port}/models/with-config`,
        );
        expect(response.status).toBe(200);

        const body = (await response.json()) as {
          models: Array<{ modelName: string; status: string }>;
          counts: {
            synced: number;
            configOnly: number;
            registryOnly: number;
            total: number;
          };
          settingsStorage: string;
        };

        const byName = new Map(
          body.models.map((model) => [model.modelName, model.status]),
        );
        expect(byName.get("synced-model")).toBe("synced");
        expect(byName.get("config-only-model")).toBe("config-only");
        expect(byName.get("registry-only-model")).toBe("registry-only");
        expect(body.counts).toEqual({
          synced: 1,
          configOnly: 1,
          registryOnly: 1,
          total: 3,
        });

        for (const model of body.models) {
          expect(model.status).not.toMatch(/litellm/i);
        }
      } finally {
        await closeServer(server);
      }
    });

    it("normalizes legacy litellm-only status labels in sync-batch", async () => {
      const stack = createRegistryTestStack();
      await stack.seedRegistryModel("legacy-registry-model");

      const { port, server } = await createRegistryHttpServer(stack, "models");

      try {
        const response = await fetch(
          `http://127.0.0.1:${port}/models/sync-batch`,
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              selections: [
                {
                  modelName: "legacy-registry-model",
                  field: "max_tokens",
                  direction: "registry-to-config",
                },
              ],
            }),
          },
        );
        expect(response.status).toBe(200);
        expect(await response.json()).toMatchObject({ success: true });
      } finally {
        await closeServer(server);
      }
    });

    it("exports consumer configs via POST /models/export-configs", async () => {
      const stack = createRegistryTestStack();
      const { port, server } = await createRegistryHttpServer(stack, "models");

      try {
        const response = await fetch(
          `http://127.0.0.1:${port}/models/export-configs`,
          { method: "POST" },
        );
        expect(response.status).toBe(200);
        expect(await response.json()).toMatchObject({ success: true });
      } finally {
        await closeServer(server);
      }
    });
  });
});
