import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRegistryTestStack } from "./helpers/registry-test-stack";

async function createRegistryHttpServer(
  stack = createRegistryTestStack(),
  routes: "models" | "credentials" | "proxy" | "all" = "all",
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

  if (routes === "credentials" || routes === "all") {
    const { registerCredentialRoutes } = await import(
      "../../../../packages/server/src/routes/credential-routes.ts"
    );
    registerCredentialRoutes(app, stack.routeOptions);
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

async function closeServer(
  server: Awaited<ReturnType<typeof createRegistryHttpServer>>["server"],
) {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

describe("registry integration", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  describe("settings roundtrip", () => {
    it("persists default credential through credential routes", async () => {
      const { port, server } = await createRegistryHttpServer(
        undefined,
        "credentials",
      );

      try {
        const putResponse = await fetch(
          `http://127.0.0.1:${port}/credentials/default`,
          {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ credentialAlias: "openai-main" }),
          },
        );
        expect(putResponse.status).toBe(200);
        expect(await putResponse.json()).toEqual({ success: true });

        const getResponse = await fetch(
          `http://127.0.0.1:${port}/credentials/default`,
        );
        expect(getResponse.status).toBe(200);
        expect(await getResponse.json()).toEqual({
          defaultCredential: "openai-main",
        });

        const clearResponse = await fetch(
          `http://127.0.0.1:${port}/credentials/default`,
          {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ credentialAlias: null }),
          },
        );
        expect(clearResponse.status).toBe(200);

        const clearedGet = await fetch(
          `http://127.0.0.1:${port}/credentials/default`,
        );
        expect(await clearedGet.json()).toEqual({ defaultCredential: null });
      } finally {
        await closeServer(server);
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
  });

  describe("credentials", () => {
    it("lists credentials with secretRef and without api_key", async () => {
      const stack = createRegistryTestStack();
      await stack.registry.credentialsService.create({
        name: "openai-main",
        provider: "openai",
        baseUrl: "https://api.openai.com/v1",
        secretRef: "OPENAI_API_KEY",
      });

      const { port, server } = await createRegistryHttpServer(
        stack,
        "credentials",
      );

      try {
        const response = await fetch(`http://127.0.0.1:${port}/credentials`);
        expect(response.status).toBe(200);

        const body = (await response.json()) as Array<Record<string, unknown>>;
        expect(body).toHaveLength(1);
        expect(body[0]).toMatchObject({
          credentialName: "openai-main",
          secretRef: "OPENAI_API_KEY",
          provider: "openai",
          baseUrl: "https://api.openai.com/v1",
        });
        expect(body[0]).not.toHaveProperty("api_key");
        expect(body[0]).not.toHaveProperty("apiKey");
        expect(body[0]).not.toHaveProperty("credentialValues");
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
        expect(body.settingsStorage).toBe("database");

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
        expect(stack.agentsManager.registry.exportAll).toHaveBeenCalled();
      } finally {
        await closeServer(server);
      }
    });
  });
});

describe("SETTINGS_STORAGE=database", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("skips syncModelsDirectlyToDatabase when storage backend is database", async () => {
    vi.stubEnv("SETTINGS_STORAGE", "database");
    vi.resetModules();

    const { syncModelsDirectlyToDatabase } = await import(
      "../../../../packages/server/src/orchestration/artifact-service.ts"
    );

    const registryModelsService = {
      list: vi.fn(async () => []),
      getRoute: vi.fn(),
      delete: vi.fn(),
      upsert: vi.fn(),
    };
    const settingsService = {
      getDefaultCredential: vi.fn(async () => null),
    };

    await syncModelsDirectlyToDatabase(
      registryModelsService as never,
      settingsService as never,
      {
        "gpt-4": {
          displayName: "GPT-4",
          limits: { length: 128000, maxOutput: 4096 },
        },
      },
    );

    expect(registryModelsService.list).not.toHaveBeenCalled();
  });
});
