import { describe, expect, it, vi } from "vitest";
import {
  handleCreateProvider,
  handleGetProvider,
  handleListModels,
  handleListProviders,
  handleSaveModel,
  handleTestProviderConnection,
  handleUpdateProvider,
  type ModelAdminHandlerDeps,
} from "./model-admin.handlers";

const modelId = "11111111-1111-4111-8111-111111111111";
const providerId = "22222222-2222-4222-8222-222222222222";

function createDeps(overrides: Partial<ModelAdminHandlerDeps> = {}) {
  const service = {
    listModels: vi.fn().mockResolvedValue([]),
    saveModel: vi.fn().mockResolvedValue({ id: modelId }),
    listProviders: vi.fn().mockResolvedValue([]),
    getProvider: vi.fn().mockResolvedValue(null),
    testProviderConnection: vi.fn().mockResolvedValue({
      message: "Connection successful.",
    }),
  };
  return {
    service,
    deps: {
      getSession: vi.fn().mockResolvedValue({
        ok: true,
        session: {
          user: { id: "actor-1", role: "admin" },
          session: { id: "s-1" },
        },
      }),
      requireAdmin: vi.fn().mockResolvedValue({ ok: true }),
      getService: vi.fn().mockResolvedValue(service),
      ...overrides,
    } satisfies ModelAdminHandlerDeps,
  };
}

describe("model-admin handlers", () => {
  it("rejects an unauthenticated read before resolving the service", async () => {
    const { deps } = createDeps({
      getSession: vi.fn().mockResolvedValue({
        ok: false,
        error: { code: "UNAUTHENTICATED", message: "No valid session found" },
      }),
    });

    await expect(handleListModels(deps)).resolves.toEqual({
      ok: false,
      error: {
        code: "UNAUTHENTICATED",
        message: "No valid session found",
        retryable: false,
      },
    });
    expect(deps.getService).not.toHaveBeenCalled();
  });

  it("rejects a viewer mutation before resolving the service", async () => {
    const { deps } = createDeps({
      getSession: vi.fn().mockResolvedValue({
        ok: true,
        session: {
          user: { id: "viewer-1", role: "viewer" },
          session: { id: "s-1" },
        },
      }),
      requireAdmin: vi.fn().mockResolvedValue({
        ok: false,
        error: { code: "FORBIDDEN", message: "Role 'admin' required" },
      }),
    });

    await expect(
      handleSaveModel(deps, { providerId, modelId, enabled: true }),
    ).resolves.toEqual({
      ok: false,
      error: {
        code: "FORBIDDEN",
        message: "Role 'admin' required",
        retryable: false,
      },
    });
    expect(deps.getService).not.toHaveBeenCalled();
  });

  it("allows a viewer read and returns the public service DTO", async () => {
    const { deps, service } = createDeps({
      getSession: vi.fn().mockResolvedValue({
        ok: true,
        session: {
          user: { id: "viewer-1", role: "viewer" },
          session: { id: "s-1" },
        },
      }),
    });
    const now = new Date("2026-07-14T00:00:00.000Z");
    const models = [
      {
        id: modelId,
        providerId,
        providerName: "Test provider",
        modelId: "gpt-test",
        enabled: true,
        revision: 1,
        displayName: null,
        family: null,
        canonicalSlug: null,
        description: null,
        contextLength: null,
        maxCompletionTokens: null,
        knowledgeCutoff: null,
        expirationDate: null,
        architecture: null,
        reasoning: null,
        supportedParameters: null,
        defaultParameters: null,
        perRequestLimits: null,
        pricing: null,
        requestOptions: null,
        reasoningApiId: null,
        createdAt: now,
        updatedAt: now,
      },
    ];
    service.listModels.mockResolvedValue(models);

    await expect(handleListModels(deps)).resolves.toEqual({
      ok: true,
      data: models,
    });
    expect(deps.requireAdmin).not.toHaveBeenCalled();
  });

  it("redacts unexpected upstream values from the public error", async () => {
    const { deps, service } = createDeps();
    service.listModels.mockRejectedValue(
      new Error("Bearer definitely-not-a-public-value"),
    );

    await expect(handleListModels(deps)).resolves.toEqual({
      ok: false,
      error: {
        code: "INTERNAL",
        message: "Internal server error",
        retryable: false,
      },
    });
  });

  it("tests an unsaved provider connection without invoking persistence", async () => {
    const { deps, service } = createDeps();
    const input = {
      provider: "openai-compatible" as const,
      baseUrl: "https://api.example.test/v1",
      credential: "test-secret-value",
    };

    await expect(handleTestProviderConnection(deps, input)).resolves.toEqual({
      ok: true,
      data: { message: "Connection successful." },
    });
    expect(service.testProviderConnection).toHaveBeenCalledWith(input);
  });

  it.each([
    ["list", (deps: ModelAdminHandlerDeps) => handleListProviders(deps)],
    [
      "get",
      (deps: ModelAdminHandlerDeps) => handleGetProvider(deps, providerId),
    ],
  ])("omits an unsafe persisted baseUrl from provider %s DTOs", async (_, call) => {
    const { deps, service } = createDeps();
    const provider = {
      id: providerId,
      name: "Unsafe persisted provider",
      provider: "openai-compatible",
      baseUrl: "https://token@example.com/v1?api_key=secret#fragment",
      isDefault: false,
      hasStoredSecret: true,
      credentialStatus: "configured" as const,
      modelCount: 0,
      revision: 1,
      createdAt: new Date("2026-07-14T00:00:00.000Z"),
      updatedAt: new Date("2026-07-14T00:00:00.000Z"),
    };
    service.listProviders.mockResolvedValue([provider]);
    service.getProvider.mockResolvedValue(provider);

    const result = await call(deps);

    expect(result).toMatchObject({ ok: true });
    expect(JSON.stringify(result)).not.toContain("token@example.com");
    expect(JSON.stringify(result)).not.toContain("api_key=secret");
    expect(JSON.stringify(result)).not.toContain("fragment");
    expect(result).toMatchObject({
      ok: true,
      data: Array.isArray((result as { data: unknown }).data)
        ? [{ baseUrl: null }]
        : { baseUrl: null },
    });
  });

  it.each([
    [
      "create",
      (deps: ModelAdminHandlerDeps) =>
        handleCreateProvider(deps, {
          name: "Private provider",
          provider: "openai-compatible",
          baseUrl: "https://token@example.com/v1",
          credential: { kind: "replace", value: "secret" },
        }),
    ],
    [
      "update",
      (deps: ModelAdminHandlerDeps) =>
        handleUpdateProvider(deps, {
          id: providerId,
          expectedRevision: 1,
          baseUrl: "https://example.com/v1?api_key=secret#fragment",
        }),
    ],
  ])("rejects unsafe baseUrl on provider %s before resolving the service", async (_, call) => {
    const { deps } = createDeps();
    const result = await call(deps);

    expect(result).toMatchObject({
      ok: false,
      error: { code: "VALIDATION", retryable: false },
    });
    expect(deps.getService).not.toHaveBeenCalled();
  });
});
