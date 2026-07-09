import { beforeEach, describe, expect, it } from "vitest";
import { RegistryModelsService } from "../registry-models.service.js";
import { createModelsRepositoryMock } from "./in-memory-repositories.js";

describe("RegistryModelsService", () => {
  let service: RegistryModelsService;

  beforeEach(() => {
    const repository = createModelsRepositoryMock();
    service = new RegistryModelsService({
      repository: repository as never,
    });
  });

  it("creates and gets model route", async () => {
    await service.create("gpt-test", {
      displayName: "GPT Test",
      pricing: { input: 0.000001 },
    });
    const route = await service.getRoute("gpt-test");
    expect(route?.displayName).toBe("GPT Test");
    expect(route?.pricing?.input).toBe(0.000001);
  });

  it("throws on duplicate create", async () => {
    await service.create("gpt-test");
    await expect(service.create("gpt-test")).rejects.toThrow(/already exists/);
  });

  it("updates model fields", async () => {
    await service.create("gpt-test", { enabled: true });
    const updated = await service.update("gpt-test", {
      enabled: false,
      maxCompletionTokens: 4096,
    });
    expect(updated.enabled).toBe(false);
    expect(updated.maxCompletionTokens).toBe(4096);
  });

  it("enables and disables models", async () => {
    await service.create("gpt-test", { enabled: false });
    const enabled = await service.enable("gpt-test");
    expect(enabled.enabled).toBe(true);
    const disabled = await service.disable("gpt-test");
    expect(disabled.enabled).toBe(false);
  });

  it("lists enabled models only", async () => {
    await service.create("enabled-model", { enabled: true });
    await service.create("disabled-model", { enabled: false });
    const enabledOnly = await service.list({ enabledOnly: true });
    expect(enabledOnly.map((row) => row.modelId)).toEqual(["enabled-model"]);
  });

  it("filters out registry rows without a modelId", async () => {
    const repository = {
      ...createModelsRepositoryMock(),
      findProviderNameById: async () => null,
      list: async () => [
        {
          id: "model_1",
          modelId: "",
          enabled: true,
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
          providerId: null,
          reasoningApiId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "model_2",
          modelId: "kept-model",
          enabled: true,
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
          providerId: null,
          reasoningApiId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };

    const filteringService = new RegistryModelsService({
      repository: repository as never,
    });

    const routes = await filteringService.listRoutes();
    expect(routes.map((route) => route.modelId)).toEqual(["kept-model"]);
  });

  it("includes the provider name on listed routes", async () => {
    const repository = {
      ...createModelsRepositoryMock(),
      findProviderNameById: async (providerId: string) =>
        providerId === "provider-1" ? "openai-main" : null,
      list: async () => [
        {
          id: "model_1",
          modelId: "gpt-4o",
          enabled: true,
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
          providerId: "provider-1",
          reasoningApiId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
    };

    const providerService = new RegistryModelsService({
      repository: repository as never,
    });

    const routes = await providerService.listRoutes();
    expect(routes[0]?.providerName).toBe("openai-main");
    expect(routes[0]?.modelId).toBe("gpt-4o");
  });

  it("upserts model route", async () => {
    const created = await service.upsert("gpt-test", {
      displayName: "First",
    });
    expect(created.displayName).toBe("First");
    const updated = await service.upsert("gpt-test", {
      displayName: "Second",
    });
    expect(updated.displayName).toBe("Second");
  });

  it("deletes model", async () => {
    await service.create("gpt-test");
    expect(await service.delete("gpt-test")).toBe(true);
    expect(await service.get("gpt-test")).toBeNull();
  });
});
