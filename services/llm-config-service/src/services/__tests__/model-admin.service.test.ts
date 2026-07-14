import { describe, expect, it, vi } from "vitest";
import type {
  AliasRow,
  ModelAdminRepository,
  ModelRow,
  ProviderRow,
} from "../../types/model-admin.js";
import { ModelAdminService } from "../model-admin.service.js";

describe("ModelAdminService", () => {
  it("normalizes aliases and rejects a stale aggregate revision without writes", async () => {
    const repository = createRepository();
    const service = new ModelAdminService({ repository });
    const provider = await service.createProvider({
      name: "OpenAI",
      provider: "ollama",
    });
    const model = await service.saveModel({
      providerId: provider.id,
      modelId: "gpt-4o",
      aliases: [" Primary "],
    });

    await expect(
      service.saveModel({
        id: model.id,
        providerId: provider.id,
        modelId: "gpt-4o-mini",
        expectedRevision: 0,
        aliases: ["secondary"],
      }),
    ).rejects.toMatchObject({
      code: "CONFLICT",
      currentRevision: model.revision,
    });

    expect(await service.getModel(model.id)).toMatchObject({
      modelId: "gpt-4o",
      aliases: [{ alias: "Primary", aliasNormalized: "primary" }],
      revision: model.revision,
    });
  });

  it("round-trips all persisted model settings and increments revision on material change", async () => {
    const repository = createRepository();
    const service = new ModelAdminService({ repository });
    const provider = await service.createProvider({
      name: "Local",
      provider: "ollama",
    });
    const created = await service.saveModel({
      providerId: provider.id,
      modelId: "llama-3",
      displayName: "Llama 3",
      family: "llama",
      canonicalSlug: "meta/llama-3",
      description: "local model",
      contextLength: 8192,
      maxCompletionTokens: 2048,
      knowledgeCutoff: "2024-01",
      expirationDate: "2026-12-31",
      architecture: { inputModalities: ["text"], outputModalities: ["text"] },
      reasoning: { effort: "high", supportsToolUse: true },
      supportedParameters: ["temperature"],
      defaultParameters: { temperature: 0.2 },
      perRequestLimits: { maxOutputTokens: 2048 },
      pricing: { input: 0, output: 0 },
      requestOptions: { headers: { "x-local": "1" } },
    });

    expect(created).toMatchObject({
      family: "llama",
      contextLength: 8192,
      pricing: { input: 0, output: 0 },
      requestOptions: { headers: { "x-local": "1" } },
      revision: 1,
    });

    const updated = await service.saveModel({
      id: created.id,
      providerId: provider.id,
      modelId: "llama-3",
      expectedRevision: created.revision,
      pricing: { input: 0.01, output: 0.02 },
      requestOptions: { headers: { "x-local": "2" } },
    });
    expect(updated).toMatchObject({
      family: "llama",
      pricing: { input: 0.01, output: 0.02 },
      requestOptions: { headers: { "x-local": "2" } },
      revision: 2,
    });
  });

  it("rolls back a model aggregate when an alias collides", async () => {
    const repository = createRepository();
    const service = new ModelAdminService({ repository });
    const provider = await service.createProvider({
      name: "OpenAI",
      provider: "ollama",
    });
    await service.saveModel({
      providerId: provider.id,
      modelId: "gpt-4o",
      aliases: ["taken"],
    });

    await expect(
      service.saveModel({
        providerId: provider.id,
        modelId: "gpt-4o-mini",
        aliases: ["taken"],
      }),
    ).rejects.toMatchObject({ code: "CONFLICT" });

    expect((await service.listModels()).map((model) => model.modelId)).toEqual([
      "gpt-4o",
    ]);
  });

  it("rolls back the created model when alias persistence fails after its write", async () => {
    const repository = createRepository();
    repository.failNextAliasInsert = true;
    const service = new ModelAdminService({ repository });
    const provider = await service.createProvider({
      name: "OpenAI",
      provider: "ollama",
    });

    await expect(
      service.saveModel({
        providerId: provider.id,
        modelId: "gpt-4o",
        aliases: ["primary"],
      }),
    ).rejects.toMatchObject({ code: "INTERNAL" });

    expect(await service.listModels()).toEqual([]);
  });

  it("uses explicit credential commands without returning stored material", async () => {
    const repository = createRepository();
    const service = new ModelAdminService({
      repository,
      encryptionKey: Buffer.from("a".repeat(32)),
    });
    const provider = await service.createProvider({
      name: "OpenAI",
      provider: "openai-compatible",
      credential: { kind: "replace", value: "test-secret-value" },
    });

    expect(provider).toMatchObject({ hasStoredSecret: true });
    expect(JSON.stringify(provider)).not.toContain("test-secret-value");

    const preserved = await service.updateProvider({
      id: provider.id,
      expectedRevision: provider.revision,
      credential: { kind: "preserve" },
    });
    expect(preserved).toMatchObject({ hasStoredSecret: true });

    const removed = await service.updateProvider({
      id: provider.id,
      expectedRevision: preserved.revision,
      credential: { kind: "remove" },
    });
    expect(removed).toMatchObject({ hasStoredSecret: false });

    await expect(
      service.createProvider({
        name: "Invalid",
        provider: "openai-compatible",
        credential: { kind: "replace", value: " " },
      }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
  });

  it("only permits credential-less creation for an explicit unauthenticated adapter", async () => {
    const repository = createRepository();
    const service = new ModelAdminService({ repository });

    await expect(
      service.createProvider({ name: "OpenAI", provider: "openai-compatible" }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(
      service.createProvider({
        name: "Invalid remove",
        provider: "openai-compatible",
        credential: { kind: "remove" },
      }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(
      service.createProvider({ name: "Unknown" }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(
      service.createProvider({ name: "Local", provider: "ollama" }),
    ).resolves.toMatchObject({ hasStoredSecret: false });
  });

  it("switches defaults and blocks provider deletion with the dependent count", async () => {
    const repository = createRepository();
    const service = new ModelAdminService({ repository });
    const first = await service.createProvider({
      name: "First",
      provider: "ollama",
      isDefault: true,
    });
    const second = await service.createProvider({
      name: "Second",
      provider: "ollama",
    });
    const defaulted = await service.setDefaultProvider({
      id: second.id,
      expectedRevision: second.revision,
    });
    expect(defaulted.isDefault).toBe(true);
    expect((await service.getProvider(first.id))?.isDefault).toBe(false);

    await service.saveModel({ providerId: second.id, modelId: "gpt-4o" });
    await expect(service.deleteProvider(second.id)).rejects.toMatchObject({
      code: "CONFLICT",
      dependentModelCount: 1,
    });
  });

  it("applies a discovery selection idempotently and reports per-item conflicts", async () => {
    const repository = createRepository();
    const service = new ModelAdminService({ repository });
    const provider = await service.createProvider({
      name: "OpenAI",
      provider: "ollama",
    });

    const first = await service.applyDiscoverySelection({
      providerId: provider.id,
      items: [{ modelId: "gpt-4o", displayName: "GPT 4o" }],
    });
    expect(first).toEqual([{ modelId: "gpt-4o", status: "created" }]);

    const repeat = await service.applyDiscoverySelection({
      providerId: provider.id,
      items: [{ modelId: "gpt-4o", displayName: "GPT 4o" }],
    });
    expect(repeat).toEqual([{ modelId: "gpt-4o", status: "unchanged" }]);

    repository.forceNextModelRevisionConflict = true;
    const conflict = await service.applyDiscoverySelection({
      providerId: provider.id,
      items: [
        {
          modelId: "gpt-4o",
          displayName: "Changed display name",
          expectedRevision: 1,
        },
      ],
    });
    expect(conflict).toEqual([
      { modelId: "gpt-4o", status: "conflict", currentRevision: 2 },
    ]);
  });

  it("lists aliases and guards model toggle and deletion with revisions", async () => {
    const service = new ModelAdminService({ repository: createRepository() });
    const provider = await service.createProvider({
      name: "Local",
      provider: "ollama",
    });
    const model = await service.saveModel({
      providerId: provider.id,
      modelId: "llama-3",
      aliases: ["primary"],
    });

    expect(await service.listAliases()).toMatchObject([
      { alias: "primary", targetModelId: model.id },
    ]);

    const disabled = await service.toggleModel({
      id: model.id,
      expectedRevision: model.revision,
      enabled: false,
    });
    expect(disabled).toMatchObject({ enabled: false, revision: 2 });

    await expect(
      service.deleteModel(model.id, model.revision),
    ).rejects.toMatchObject({ code: "CONFLICT", currentRevision: 2 });
    await expect(
      service.deleteModel(model.id, disabled.revision),
    ).rejects.toMatchObject({ code: "CONFLICT" });

    const [alias] = await service.listAliases();
    await service.deleteAlias(alias!.id, alias!.revision);
    await expect(
      service.deleteModel(model.id, disabled.revision),
    ).resolves.toBeUndefined();
    expect(await service.getModel(model.id)).toBeNull();
  });

  it("discovers and probes OpenAI-compatible providers inside the narrow credential callback", async () => {
    const requests: Array<{
      method: string;
      url: string;
      authorization?: string;
    }> = [];
    const service = new ModelAdminService({
      repository: createRepository(),
      encryptionKey: Buffer.from("a".repeat(32)),
      destinationResolver: async () => ["8.8.8.8"],
      upstreamTransport: {
        request: async (request) => {
          requests.push({
            method: request.method,
            url: request.url.toString(),
            authorization: request.headers.authorization,
          });
          return request.method === "GET"
            ? {
                status: 200,
                body: JSON.stringify({ data: [{ id: "gpt-test" }] }),
              }
            : {
                status: 200,
                body: JSON.stringify({
                  choices: [{ message: { content: "short answer" } }],
                }),
              };
        },
      },
    });
    const provider = await service.createProvider({
      name: "Remote",
      provider: "openai-compatible",
      baseUrl: "https://api.example.test/v1",
      credential: { kind: "replace", value: "test-secret-value" },
    });

    await expect(service.discoverModels(provider.id)).resolves.toEqual({
      models: [{ modelId: "gpt-test", displayName: null, status: "new" }],
    });
    await expect(
      service.probeModel({
        providerId: provider.id,
        modelId: "gpt-test",
        prompt: "Say hello",
      }),
    ).resolves.toEqual({
      modelId: "gpt-test",
      content: "short answer",
      truncated: false,
    });

    expect(requests).toEqual([
      {
        method: "GET",
        url: "https://api.example.test/v1/models",
        authorization: "Bearer test-secret-value",
      },
      {
        method: "POST",
        url: "https://api.example.test/v1/chat/completions",
        authorization: "Bearer test-secret-value",
      },
    ]);
  });

  it("computes discovery new, changed, unchanged, and alias-conflict rows from supported metadata", async () => {
    const repository = createRepository();
    const service = new ModelAdminService({
      repository,
      encryptionKey: Buffer.from("a".repeat(32)),
      destinationResolver: async () => ["8.8.8.8"],
      upstreamTransport: {
        request: async () => ({
          status: 200,
          body: JSON.stringify({
            data: [
              { id: "gpt-new", display_name: "New" },
              { id: "gpt-changed", name: "Changed" },
              { id: "gpt-unchanged", display_name: "Same" },
              { id: "reserved-alias", display_name: "Blocked" },
            ],
          }),
        }),
      },
    });
    const provider = await service.createProvider({
      name: "Remote",
      provider: "openai-compatible",
      baseUrl: "https://api.example.test/v1",
      credential: { kind: "replace", value: "test-secret-value" },
    });
    await service.saveModel({
      providerId: provider.id,
      modelId: "gpt-changed",
      displayName: "Old",
    });
    await service.saveModel({
      providerId: provider.id,
      modelId: "gpt-unchanged",
      displayName: "Same",
      aliases: ["reserved-alias"],
    });

    await expect(service.discoverModels(provider.id)).resolves.toEqual({
      models: [
        { modelId: "gpt-new", displayName: "New", status: "new" },
        {
          modelId: "gpt-changed",
          displayName: "Changed",
          status: "changed",
          currentRevision: 1,
        },
        {
          modelId: "gpt-unchanged",
          displayName: "Same",
          status: "unchanged",
          currentRevision: 1,
        },
        {
          modelId: "reserved-alias",
          displayName: "Blocked",
          status: "conflict",
        },
      ],
    });
  });

  it("blocks unsafe discovery destinations before sending the credential upstream", async () => {
    const request = vi.fn();
    const service = new ModelAdminService({
      repository: createRepository(),
      encryptionKey: Buffer.from("a".repeat(32)),
      destinationResolver: async () => ["127.0.0.1"],
      upstreamTransport: { request },
    });
    const provider = await service.createProvider({
      name: "Blocked",
      provider: "openai-compatible",
      baseUrl: "https://internal.example.test/v1",
      credential: { kind: "replace", value: "secret-never-sent" },
    });

    await expect(service.discoverModels(provider.id)).rejects.toMatchObject({
      code: "DESTINATION_BLOCKED",
    });
    expect(request).not.toHaveBeenCalled();
  });

  it("blocks userinfo, literal IPs, non-443 origins, and reserved IPv6 before upstream use", async () => {
    const request = vi.fn();
    const resolver = vi.fn(async () => ["2001:db8::1"]);
    for (const baseUrl of [
      "https://user:pass@api.example.test/v1",
      "https://8.8.8.8/v1",
      "https://api.example.test:8443/v1",
      "https://api.example.test/v1",
    ]) {
      const service = new ModelAdminService({
        repository: createRepository(),
        encryptionKey: Buffer.from("a".repeat(32)),
        destinationResolver: resolver,
        upstreamTransport: { request },
      });
      const provider = await service.createProvider({
        name: baseUrl,
        provider: "openai-compatible",
        baseUrl,
        credential: { kind: "replace", value: "test-secret-value" },
      });
      await expect(service.discoverModels(provider.id)).rejects.toMatchObject({
        code: "DESTINATION_BLOCKED",
      });
    }
    expect(request).not.toHaveBeenCalled();
  });

  it("blocks every reserved IPv6 class used by the destination policy", async () => {
    const reservedAddresses = [
      "::1",
      "::ffff:127.0.0.1",
      "64:ff9b:1::1",
      "100::1",
      "100:0:0:1::1",
      "2001:1::1",
      "2001:2::1",
      "2001:10::1",
      "2001:20::1",
      "2001:db8::1",
      "2002::1",
      "3fff::1",
      "fc00::1",
      "fe80::1",
      "ff00::1",
    ];
    for (const address of reservedAddresses) {
      const request = vi.fn();
      const service = new ModelAdminService({
        repository: createRepository(),
        encryptionKey: Buffer.from("a".repeat(32)),
        destinationResolver: async () => [address],
        upstreamTransport: { request },
      });
      const provider = await service.createProvider({
        name: address,
        provider: "openai-compatible",
        baseUrl: "https://api.example.test/v1",
        credential: { kind: "replace", value: "test-secret-value" },
      });
      await expect(service.discoverModels(provider.id)).rejects.toMatchObject({
        code: "DESTINATION_BLOCKED",
      });
      expect(request).not.toHaveBeenCalled();
    }
  });

  it("permits an exact HTTPS allowlist origin, including its pinned private destination", async () => {
    const request = vi.fn(async () => ({
      status: 200,
      body: JSON.stringify({ data: [] }),
    }));
    const service = new ModelAdminService({
      repository: createRepository(),
      encryptionKey: Buffer.from("a".repeat(32)),
      destinationAllowlist: ["https://onprem.example.test:8443"],
      destinationResolver: async () => ["10.0.0.8"],
      upstreamTransport: { request },
    });
    const provider = await service.createProvider({
      name: "On prem",
      provider: "openai-compatible",
      baseUrl: "https://onprem.example.test:8443/v1",
      credential: { kind: "replace", value: "test-secret-value" },
    });

    await expect(service.discoverModels(provider.id)).resolves.toEqual({
      models: [],
    });
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ address: "10.0.0.8" }),
    );
  });

  it("enforces discovery response and model-count limits, redirect refusal, and DNS pinning", async () => {
    const providerInput = {
      name: "Remote",
      provider: "openai-compatible" as const,
      baseUrl: "https://api.example.test/v1",
      credential: { kind: "replace" as const, value: "test-secret-value" },
    };
    const testFailure = async (response: { status: number; body: string }) => {
      const service = new ModelAdminService({
        repository: createRepository(),
        encryptionKey: Buffer.from("a".repeat(32)),
        destinationResolver: async () => ["8.8.8.8"],
        upstreamTransport: { request: async () => response },
      });
      const provider = await service.createProvider(providerInput);
      await expect(service.discoverModels(provider.id)).rejects.toMatchObject({
        code: "UPSTREAM_UNAVAILABLE",
      });
    };

    await testFailure({ status: 302, body: "redirect-body" });
    await testFailure({ status: 200, body: "x".repeat(1024 * 1024 + 1) });
    await testFailure({
      status: 200,
      body: JSON.stringify({
        data: Array.from({ length: 2_001 }, (_, index) => ({
          id: `model-${index}`,
        })),
      }),
    });

    const request = vi.fn(async () => ({
      status: 200,
      body: JSON.stringify({ data: [] }),
    }));
    const service = new ModelAdminService({
      repository: createRepository(),
      encryptionKey: Buffer.from("a".repeat(32)),
      destinationResolver: async () => ["1.1.1.1", "8.8.8.8"],
      upstreamTransport: { request },
    });
    const provider = await service.createProvider(providerInput);
    await service.discoverModels(provider.id);
    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ address: "1.1.1.1" }),
    );
  });

  it("maps upstream timeout and error bodies to public, redacted results and truncates probe output", async () => {
    const service = new ModelAdminService({
      repository: createRepository(),
      encryptionKey: Buffer.from("a".repeat(32)),
      destinationResolver: async () => ["8.8.4.4"],
      upstreamTransport: {
        request: async (request) => {
          if (request.method === "GET") {
            throw new DOMException("timed out", "AbortError");
          }
          return {
            status: 401,
            body: "upstream-secret-body-must-not-leak",
          };
        },
      },
    });
    const provider = await service.createProvider({
      name: "Remote",
      provider: "openai-compatible",
      baseUrl: "https://api.example.test/v1",
      credential: { kind: "replace", value: "test-secret-value" },
    });

    await expect(service.discoverModels(provider.id)).rejects.toMatchObject({
      code: "TIMEOUT",
      retryable: true,
    });
    await expect(
      service.probeModel({
        providerId: provider.id,
        modelId: "gpt-test",
        prompt: "x".repeat(1025),
      }),
    ).rejects.toMatchObject({ code: "VALIDATION" });
    await expect(
      service.probeModel({
        providerId: provider.id,
        modelId: "gpt-test",
        prompt: "safe",
      }),
    ).rejects.toSatisfy((error: unknown) => {
      expect(error).toMatchObject({ code: "UPSTREAM_UNAVAILABLE" });
      expect(JSON.stringify(error)).not.toContain(
        "upstream-secret-body-must-not-leak",
      );
      return true;
    });
  });

  it("truncates a successful probe response at 8 KiB without splitting Unicode", async () => {
    const service = new ModelAdminService({
      repository: createRepository(),
      encryptionKey: Buffer.from("a".repeat(32)),
      destinationResolver: async () => ["1.1.1.1"],
      upstreamTransport: {
        request: async () => ({
          status: 200,
          body: JSON.stringify({
            choices: [{ message: { content: "🙂".repeat(5_000) } }],
          }),
        }),
      },
    });
    const provider = await service.createProvider({
      name: "Remote",
      provider: "openai-compatible",
      baseUrl: "https://api.example.test/v1",
      credential: { kind: "replace", value: "test-secret-value" },
    });

    const result = await service.probeModel({
      providerId: provider.id,
      modelId: "gpt-test",
      prompt: "safe",
    });
    expect(result.truncated).toBe(true);
    expect(Buffer.byteLength(result.content, "utf8")).toBe(8 * 1024);
    expect(result.content.endsWith("🙂")).toBe(true);
  });
});

function createRepository() {
  return new InMemoryModelAdminRepository();
}

type Store = {
  providers: Map<string, ProviderRow>;
  models: Map<string, ModelRow>;
  aliases: Map<string, AliasRow>;
  nextProviderId: number;
  nextModelId: number;
  nextAliasId: number;
};

class InMemoryModelAdminRepository implements ModelAdminRepository {
  failNextAliasInsert = false;
  forceNextModelRevisionConflict = false;

  constructor(
    private state: Store = {
      providers: new Map(),
      models: new Map(),
      aliases: new Map(),
      nextProviderId: 1,
      nextModelId: 1,
      nextAliasId: 1,
    },
  ) {}

  async transaction<T>(
    operation: (repository: ModelAdminRepository) => Promise<T>,
  ): Promise<T> {
    const copy = new InMemoryModelAdminRepository({
      providers: new Map(this.state.providers),
      models: new Map(this.state.models),
      aliases: new Map(this.state.aliases),
      nextProviderId: this.state.nextProviderId,
      nextModelId: this.state.nextModelId,
      nextAliasId: this.state.nextAliasId,
    });
    copy.failNextAliasInsert = this.failNextAliasInsert;
    copy.forceNextModelRevisionConflict = this.forceNextModelRevisionConflict;
    const result = await operation(copy);
    this.state = copy.state;
    return result;
  }

  async getProvider(id: string) {
    return this.state.providers.get(id) ?? null;
  }

  async getProviderByName(name: string) {
    return (
      [...this.state.providers.values()].find(
        (provider) => provider.name === name,
      ) ?? null
    );
  }

  async listProviders() {
    return [...this.state.providers.values()];
  }

  async insertProvider(
    input: Omit<ProviderRow, "id" | "revision" | "createdAt" | "updatedAt">,
  ) {
    const now = new Date();
    const row: ProviderRow = {
      ...input,
      id: `provider-${this.state.nextProviderId++}`,
      revision: 1,
      createdAt: now,
      updatedAt: now,
    };
    this.state.providers.set(row.id, row);
    return row;
  }

  async updateProviderIfRevision(
    id: string,
    expectedRevision: number,
    input: Partial<
      Omit<ProviderRow, "id" | "revision" | "createdAt" | "updatedAt">
    >,
  ) {
    const current = await this.getProvider(id);
    if (!current || current.revision !== expectedRevision) return null;
    const updated = {
      ...current,
      ...input,
      revision: current.revision + 1,
      updatedAt: new Date(),
    };
    this.state.providers.set(id, updated);
    return updated;
  }

  async clearDefaultProviders(exceptId?: string) {
    for (const provider of this.state.providers.values()) {
      if (provider.id !== exceptId && provider.isDefault) {
        this.state.providers.set(provider.id, {
          ...provider,
          isDefault: false,
          revision: provider.revision + 1,
          updatedAt: new Date(),
        });
      }
    }
  }

  async countModelsByProvider(providerId: string) {
    return [...this.state.models.values()].filter(
      (model) => model.providerId === providerId,
    ).length;
  }

  async deleteProvider(id: string) {
    return this.state.providers.delete(id);
  }

  async getModel(id: string) {
    return this.state.models.get(id) ?? null;
  }

  async getModelByProviderAndModelId(providerId: string, modelId: string) {
    return (
      [...this.state.models.values()].find(
        (model) => model.providerId === providerId && model.modelId === modelId,
      ) ?? null
    );
  }

  async listModels() {
    return [...this.state.models.values()];
  }

  async insertModel(
    input: Omit<ModelRow, "id" | "revision" | "createdAt" | "updatedAt">,
  ) {
    const now = new Date();
    const row: ModelRow = {
      ...input,
      id: `model-${this.state.nextModelId++}`,
      revision: 1,
      createdAt: now,
      updatedAt: now,
    };
    this.state.models.set(row.id, row);
    return row;
  }

  async updateModelIfRevision(
    id: string,
    expectedRevision: number,
    input: Partial<
      Omit<ModelRow, "id" | "revision" | "createdAt" | "updatedAt">
    >,
  ) {
    const current = await this.getModel(id);
    if (!current || current.revision !== expectedRevision) return null;
    if (this.forceNextModelRevisionConflict) {
      this.forceNextModelRevisionConflict = false;
      this.state.models.set(id, {
        ...current,
        revision: current.revision + 1,
        updatedAt: new Date(),
      });
      return null;
    }
    const updated = {
      ...current,
      ...input,
      revision: current.revision + 1,
      updatedAt: new Date(),
    };
    this.state.models.set(id, updated);
    return updated;
  }

  async deleteModelIfRevision(id: string, expectedRevision: number) {
    const current = this.state.models.get(id);
    if (!current) return false;
    if (current.revision !== expectedRevision) return "conflict" as const;
    this.state.models.delete(id);
    return true;
  }

  async listAliases() {
    return [...this.state.aliases.values()];
  }

  async listAliasesForModel(modelId: string) {
    return [...this.state.aliases.values()].filter(
      (alias) => alias.targetModelId === modelId,
    );
  }

  async insertAlias(
    input: Omit<AliasRow, "id" | "revision" | "createdAt" | "updatedAt">,
  ) {
    if (this.failNextAliasInsert) {
      this.failNextAliasInsert = false;
      throw new Error("simulated persistence boundary failure");
    }
    const now = new Date();
    const row: AliasRow = {
      ...input,
      id: `alias-${this.state.nextAliasId++}`,
      revision: 1,
      createdAt: now,
      updatedAt: now,
    };
    this.state.aliases.set(row.id, row);
    return row;
  }

  async updateAliasIfRevision(
    id: string,
    expectedRevision: number,
    input: Pick<AliasRow, "alias" | "aliasNormalized" | "targetModelId">,
  ) {
    const current = this.state.aliases.get(id);
    if (!current || current.revision !== expectedRevision) return null;
    const updated = {
      ...current,
      ...input,
      revision: current.revision + 1,
      updatedAt: new Date(),
    };
    this.state.aliases.set(id, updated);
    return updated;
  }

  async deleteAliasIfRevision(id: string, expectedRevision: number) {
    const current = this.state.aliases.get(id);
    if (!current) return false;
    if (current.revision !== expectedRevision) return "conflict" as const;
    this.state.aliases.delete(id);
    return true;
  }

  async deleteAliasesForModel(modelId: string) {
    for (const alias of await this.listAliasesForModel(modelId)) {
      this.state.aliases.delete(alias.id);
    }
  }
}
