import type { AddressInfo } from "node:net";
import type { ModelRoute } from "@lite-llm/llm-config-service";
import type { RouteOptions } from "@lite-llm/server";
import { afterEach, describe, expect, it, vi } from "vitest";

type PersistedModelConfigSpec = {
  enabled?: boolean;
  displayName: string;
  family?: string;
  ownedBy?: string;
  apiMode?: "openai" | "anthropic";
  vision?: boolean;
  limits: {
    length: number;
    maxOutput: number;
  };
  cost?: {
    input?: number;
    output?: number;
  };
  thinking?: {
    levels: string[];
  };
  reasoning?: {
    effort?: "low" | "medium" | "high" | "xhigh";
    enableThinking?: boolean;
    includeReasoningInRequest?: boolean;
    apiMode?: "openai" | "anthropic";
  };
};

function createModelRoutesStack() {
  const configModels = new Map<string, PersistedModelConfigSpec>();
  const registryRoutes = new Map<string, ModelRoute>();

  const routeOptions: RouteOptions = {
    dataSource: {
      getModels: async () => [],
      getProviders: async () => [],
      getModelDetails: async () => [],
      deleteModelLogs: async () => undefined,
    } as RouteOptions["dataSource"],
    orchestration: {
      dataSource: {} as RouteOptions["dataSource"],
      syncGeneratedArtifacts: async () => undefined,
    },
    heboGateway: {
      handler: vi.fn(),
      onRequestFinished: vi.fn(() => () => undefined),
      refresh: vi.fn(async () => undefined),
    } as RouteOptions["heboGateway"],
    modelsService: {
      getAll: async () => Object.fromEntries(configModels),
      get: async (key) => configModels.get(key),
      getEnabledModelNames: async () =>
        new Set(
          [...configModels.entries()]
            .filter(([, spec]) => spec.enabled !== false)
            .map(([key]) => key),
        ),
      create: async (key, spec) => {
        if (configModels.has(key)) {
          throw new Error(`Model "${key}" already exists`);
        }
        configModels.set(key, spec as PersistedModelConfigSpec);
      },
      update: async (key, spec) => {
        const existing = configModels.get(key);
        if (!existing) {
          throw new Error(`Model "${key}" not found`);
        }
        const next = { ...existing, ...spec } as PersistedModelConfigSpec;
        for (const [field, value] of Object.entries(spec)) {
          if (value === undefined) {
            delete next[field as keyof PersistedModelConfigSpec];
          }
        }
        configModels.set(key, next);
      },
      upsert: async (key, spec) => {
        configModels.set(key, spec as PersistedModelConfigSpec);
      },
      delete: async (key) => {
        if (!configModels.delete(key)) {
          throw new Error(`Model "${key}" not found`);
        }
      },
    },
    providerService: {
      getAll: async () => ({}),
      get: async () => undefined,
      create: async () => undefined,
      update: async () => undefined,
      upsert: async () => undefined,
      delete: async () => undefined,
    },
    registry: {
      settingsService: {
        getByKey: async () => null,
        list: async () => [],
        upsertByKey: async () => {
          throw new Error("not implemented");
        },
        deleteByKey: async () => false,
        getDefaultProvider: async () => null,
        setDefaultProvider: async () => undefined,
        deleteDefaultProvider: async () => false,
        getHealthCheckPrompt: async () => null,
        setHealthCheckPrompt: async () => undefined,
        getRouterSettings: async () => null,
        setRouterSettings: async () => undefined,
      },
      registryModelsService: {
        list: async () => [],
        listRoutes: async () => [...registryRoutes.values()],
        get: async () => null,
        getRoute: async (modelName) => registryRoutes.get(modelName) ?? null,
        create: async (modelName, route = {}) => {
          if (registryRoutes.has(modelName)) {
            throw new Error(`Model "${modelName}" already exists`);
          }
          const created = { modelName, ...route };
          registryRoutes.set(modelName, created);
          return created as never;
        },
        update: async (modelName, route) => {
          const existing = registryRoutes.get(modelName);
          if (!existing) {
            throw new Error(`Model "${modelName}" not found`);
          }
          const updated = {
            ...existing,
            ...route,
            modelName: route.modelName ?? existing.modelName,
          };
          registryRoutes.delete(modelName);
          registryRoutes.set(updated.modelName, updated);
          return updated as never;
        },
        upsert: async (modelName, route = {}) => {
          const updated = {
            ...(registryRoutes.get(modelName) ?? { modelName }),
            ...route,
            modelName,
          };
          registryRoutes.set(modelName, updated);
          return updated as never;
        },
        enable: async (modelName) => {
          const route = registryRoutes.get(modelName);
          if (!route) {
            throw new Error(`Model "${modelName}" not found`);
          }
          const updated = { ...route, enabled: true };
          registryRoutes.set(modelName, updated);
          return updated as never;
        },
        disable: async (modelName) => {
          const route = registryRoutes.get(modelName);
          if (!route) {
            throw new Error(`Model "${modelName}" not found`);
          }
          const updated = { ...route, enabled: false };
          registryRoutes.set(modelName, updated);
          return updated as never;
        },
        delete: async (modelName) => registryRoutes.delete(modelName),
      },
      providersService: {
        list: async () => [],
        get: async () => null,
        create: async () => {
          throw new Error("not implemented");
        },
        update: async () => {
          throw new Error("not implemented");
        },
        upsert: async () => {
          throw new Error("not implemented");
        },
        delete: async () => false,
      },
      apiKeysService: {
        list: async () => [],
        get: async () => null,
        create: async () => {
          throw new Error("not implemented");
        },
        enable: async () => {
          throw new Error("not implemented");
        },
        disable: async () => {
          throw new Error("not implemented");
        },
        delete: async () => false,
        verifyKey: async () => null,
      },
      openAiOAuthService: {
        getConnectionStatus: async () => ({
          connected: false,
          accountId: null,
          expiresAt: null,
          baseUrl: "https://chatgpt.com/backend-api/codex",
        }),
        startDeviceAuthorization: async () => {
          throw new Error("not implemented");
        },
        pollDeviceAuthorization: async () => {
          throw new Error("not implemented");
        },
        disconnect: async () => undefined,
        getAuthenticatedRequestConfig: async () => {
          throw new Error("not implemented");
        },
      },
    },
  };

  return { routeOptions, configModels, registryRoutes };
}

async function createModelsServer() {
  const express = (await import("express")).default;
  const { registerModelRoutes } =
    await import("../../../../packages/server/src/routes/model-routes.ts");

  const stack = createModelRoutesStack();
  const app = express();
  app.use(express.json());
  registerModelRoutes(app, stack.routeOptions);

  const server = app.listen(0);
  await new Promise<void>((resolve) => {
    server.once("listening", () => resolve());
  });

  return {
    ...stack,
    server,
    port: (server.address() as AddressInfo).port,
  };
}

async function closeServer(server: {
  close: (cb: (error?: Error) => void) => void;
}) {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

describe("model routes save", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("creates a config entry when saving a registry-only model", async () => {
    const stack = await createModelsServer();
    stack.registryRoutes.set("registry-only-model", {
      modelName: "registry-only-model",
      maxOutputTokens: 4096,
    });

    try {
      const response = await fetch(
        `http://127.0.0.1:${stack.port}/models/registry-only-model`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            modelRoute: {
              enabled: false,
              maxOutputTokens: 8192,
            },
            config: {
              displayName: "Registry Only",
              vision: true,
            },
          }),
        },
      );

      expect(response.status).toBe(200);
      expect(stack.configModels.get("registry-only-model")).toEqual({
        enabled: false,
        displayName: "Registry Only",
        vision: true,
        limits: {
          length: 200_000,
          maxOutput: 8192,
        },
        cost: undefined,
      });
    } finally {
      await closeServer(stack.server);
    }
  });

  it("updates provider-prefixed config entries when saving by bare model name", async () => {
    const stack = await createModelsServer();
    stack.configModels.set("openai/gpt-shared", {
      enabled: true,
      displayName: "Old Name",
      limits: {
        length: 128_000,
        maxOutput: 4096,
      },
    });
    stack.registryRoutes.set("gpt-shared", {
      modelName: "gpt-shared",
      providerName: "openai",
      maxOutputTokens: 4096,
    });

    try {
      const response = await fetch(
        `http://127.0.0.1:${stack.port}/models/gpt-shared`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            modelRoute: {
              providerName: "openai",
            },
            config: {
              displayName: "New Name",
              vision: true,
            },
          }),
        },
      );

      expect(response.status).toBe(200);
      expect(stack.configModels.get("gpt-shared")).toBeUndefined();
      expect(stack.configModels.get("openai/gpt-shared")).toEqual({
        enabled: true,
        displayName: "New Name",
        limits: {
          length: 128_000,
          maxOutput: 4096,
        },
        vision: true,
      });
    } finally {
      await closeServer(stack.server);
    }
  });

  it("hydrates bare registry entries with provider-scoped config on /models/with-config", async () => {
    const stack = await createModelsServer();
    stack.configModels.set("openai/gpt-shared", {
      enabled: true,
      displayName: "Pretty GPT",
      family: "gpt-family",
      limits: {
        length: 128_000,
        maxOutput: 4096,
      },
    });
    stack.registryRoutes.set("gpt-shared", {
      modelId: "gpt-shared",
      providerName: "openai",
      maxOutputTokens: 4096,
    });

    try {
      const response = await fetch(
        `http://127.0.0.1:${stack.port}/models/with-config`,
      );

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({
        counts: {
          synced: 1,
          configOnly: 1,
          registryOnly: 0,
          total: 2,
        },
        settingsStorage: "database",
        models: [
          {
            modelName: "gpt-shared",
            modelRoute: {
              modelId: "gpt-shared",
              modelName: "gpt-shared",
              providerName: "openai",
              maxOutputTokens: 4096,
            },
            enabled: true,
            config: {
              displayName: "Pretty GPT",
              family: "gpt-family",
            },
            status: "synced",
          },
          {
            modelName: "openai/gpt-shared",
            modelRoute: {
              modelId: "openai/gpt-shared",
              modelName: "openai/gpt-shared",
              providerName: "openai",
            },
            enabled: true,
            config: {
              displayName: "Pretty GPT",
              family: "gpt-family",
            },
            status: "config-only",
          },
        ],
      });
    } finally {
      await closeServer(stack.server);
    }
  });
});
