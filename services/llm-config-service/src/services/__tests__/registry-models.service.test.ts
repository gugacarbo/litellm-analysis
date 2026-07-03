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
      inputCostPerToken: 0.000001,
      providerName: "openai-main",
    });
    const route = await service.getRoute("gpt-test");
    expect(route?.displayName).toBe("GPT Test");
    expect(route?.providerName).toBe("openai-main");
  });

  it("throws on duplicate create", async () => {
    await service.create("gpt-test");
    await expect(service.create("gpt-test")).rejects.toThrow(/already exists/);
  });

  it("updates model fields", async () => {
    await service.create("gpt-test", { enabled: true });
    const updated = await service.update("gpt-test", {
      enabled: false,
      maxOutputTokens: 4096,
    });
    expect(updated.enabled).toBe(false);
    expect(updated.maxOutputTokens).toBe(4096);
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
    expect(enabledOnly.map((row) => row.modelName)).toEqual(["enabled-model"]);
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
