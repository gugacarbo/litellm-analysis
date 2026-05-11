import type { IAgentsRepository } from "@lite-llm/agents-repository/repository";
import type { CategoryEntry } from "@lite-llm/agents-repository/schema";
import { describe, expect, it } from "vitest";
import { CategoryService } from "../category.service";

function createMockRepo(
  overrides: Record<string, unknown> = {},
): IAgentsRepository {
  const store: Record<string, unknown> = {
    version: 2,
    litellm: { baseUrl: "", apiKey: "" },
    models: {},
    agents: {},
    categories: {},
  };
  const data = { ...store, ...overrides };
  return {
    read: async () => data,
    write: async (config: Record<string, unknown>) => Object.assign(data, config),
    readSync: () => data,
    validate: ((_config: unknown): _config is never => true) as IAgentsRepository["validate"],
    exists: async () => true,
    getPath: () => "/tmp/test.json",
  } as unknown as IAgentsRepository;
}

describe("CategoryService", () => {
  describe("getAll", () => {
    it("retorna todas as categorias", async () => {
      const categories: Record<string, CategoryEntry> = {
        dev: { model: "gpt-4" },
        review: { model: "gpt-3.5" },
      };
      const repo = createMockRepo({ categories });
      const service = new CategoryService({ repository: repo });
      expect(await service.getAll()).toEqual(categories);
    });

    it("retorna objeto vazio quando não há categorias", async () => {
      const repo = createMockRepo({ categories: {} });
      const service = new CategoryService({ repository: repo });
      expect(await service.getAll()).toEqual({});
    });
  });

  describe("get", () => {
    it("retorna categoria específica", async () => {
      const repo = createMockRepo({
        categories: { dev: { model: "gpt-4" } },
      });
      const service = new CategoryService({ repository: repo });
      expect(await service.get("dev")).toEqual({ model: "gpt-4" });
    });

    it("retorna undefined para categoria inexistente", async () => {
      const repo = createMockRepo({ categories: {} });
      const service = new CategoryService({ repository: repo });
      expect(await service.get("nonexistent")).toBeUndefined();
    });
  });

  describe("create", () => {
    it("adiciona categoria ao repositório", async () => {
      const repo = createMockRepo({ categories: {} });
      const service = new CategoryService({ repository: repo });
      await service.create("dev", { model: "gpt-4" });
      expect(await service.get("dev")).toEqual({ model: "gpt-4" });
    });

    it("lança erro se categoria já existe", async () => {
      const repo = createMockRepo({
        categories: { dev: { model: "gpt-4" } },
      });
      const service = new CategoryService({ repository: repo });
      await expect(service.create("dev", { model: "gpt-4" })).rejects.toThrow(
        "already exists",
      );
    });
  });

  describe("update", () => {
    it("atualiza categoria existente com merge parcial", async () => {
      const repo = createMockRepo({
        categories: { dev: { model: "gpt-4", description: "Dev cat" } },
      });
      const service = new CategoryService({ repository: repo });
      await service.update("dev", { model: "gpt-3.5" });
      const result = await service.get("dev");
      expect(result?.model).toBe("gpt-3.5");
      expect(result?.description).toBe("Dev cat");
    });

    it("lança erro se categoria não existe", async () => {
      const repo = createMockRepo({ categories: {} });
      const service = new CategoryService({ repository: repo });
      await expect(
        service.update("nonexistent", { model: "gpt-4" }),
      ).rejects.toThrow("not found");
    });
  });

  describe("upsert", () => {
    it("cria categoria se não existe", async () => {
      const repo = createMockRepo({ categories: {} });
      const service = new CategoryService({ repository: repo });
      await service.upsert("dev", { model: "gpt-4" });
      expect(await service.get("dev")).toEqual({ model: "gpt-4" });
    });

    it("atualiza categoria se já existe", async () => {
      const repo = createMockRepo({
        categories: { dev: { model: "gpt-4" } },
      });
      const service = new CategoryService({ repository: repo });
      await service.upsert("dev", { model: "gpt-3.5" });
      expect((await service.get("dev"))?.model).toBe("gpt-3.5");
    });
  });

  describe("delete", () => {
    it("remove categoria existente", async () => {
      const repo = createMockRepo({
        categories: { dev: { model: "gpt-4" } },
      });
      const service = new CategoryService({ repository: repo });
      await service.delete("dev");
      expect(await service.get("dev")).toBeUndefined();
    });

    it("lança erro se categoria não existe", async () => {
      const repo = createMockRepo({ categories: {} });
      const service = new CategoryService({ repository: repo });
      await expect(service.delete("nonexistent")).rejects.toThrow("not found");
    });
  });
});
