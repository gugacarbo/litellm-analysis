import type { AddressInfo } from "node:net";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRegistryTestStack } from "./helpers/registry-test-stack";

async function createRegistryHttpServer(
  stack = createRegistryTestStack(),
  routes: "models" | "proxy" | "all" = "all",
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
