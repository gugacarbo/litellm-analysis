import { describe, expect, it, beforeEach } from "vitest";
import { MemoryStorage } from "@lite-llm/repository-utils";
import { createRepository } from "@lite-llm/models-repository/repository";
import { ModelService } from "../model.service.js";

function createTestRepo(files: Record<string, string>) {
  return createRepository({
    filePath: "/test/models.json",
    storage: new MemoryStorage(files),
  });
}

describe("ModelService", () => {
  let service: ModelService;

  beforeEach(() => {
    const repo = createTestRepo({
      "/test/models.json": JSON.stringify({
        version: 1,
        provider: {},
        models: {
          "test-model": {
            enabled: true,
            displayName: "Test Model",
            limits: { length: 1000, maxOutput: 500 },
          },
        },
      }),
    });
    service = new ModelService({ repository: repo });
  });

  it("gets all models", async () => {
    const models = await service.getAll();
    expect(models["test-model"]).toBeDefined();
    expect(models["test-model"].displayName).toBe("Test Model");
  });

  it("gets a specific model", async () => {
    const model = await service.get("test-model");
    expect(model).toBeDefined();
    expect(model?.displayName).toBe("Test Model");
  });

  it("returns undefined for missing model", async () => {
    const model = await service.get("nonexistent");
    expect(model).toBeUndefined();
  });

  it("creates a new model", async () => {
    await service.create("new-model", {
      enabled: false,
      displayName: "New Model",
      limits: { length: 500, maxOutput: 200 },
    });
    const model = await service.get("new-model");
    expect(model?.displayName).toBe("New Model");
  });

  it("throws on duplicate create", async () => {
    await expect(
      service.create("test-model", {
        enabled: true,
        displayName: "Duplicate",
        limits: { length: 100, maxOutput: 50 },
      }),
    ).rejects.toThrow(/already exists/);
  });

  it("updates an existing model", async () => {
    await service.update("test-model", { displayName: "Updated" });
    const model = await service.get("test-model");
    expect(model?.displayName).toBe("Updated");
    expect(model?.enabled).toBe(true); // unchanged
  });

  it("throws on update of missing model", async () => {
    await expect(
      service.update("nonexistent", { displayName: "Nope" }),
    ).rejects.toThrow(/not found/);
  });

  it("upserts a model", async () => {
    await service.upsert("test-model", {
      enabled: false,
      displayName: "Upserted",
      limits: { length: 999, maxOutput: 111 },
    });
    const model = await service.get("test-model");
    expect(model?.displayName).toBe("Upserted");
    expect(model?.limits.length).toBe(999);
  });

  it("deletes a model", async () => {
    await service.delete("test-model");
    const model = await service.get("test-model");
    expect(model).toBeUndefined();
  });

  it("throws on delete of missing model", async () => {
    await expect(service.delete("nonexistent")).rejects.toThrow(
      /not found/,
    );
  });
});
