import type { IAgentsRepository } from "@lite-llm/agents-repository/repository";
import type { ModelSpec } from "@lite-llm/agents-repository/schemas";
import { describe, expect, it } from "vitest";
import { ModelService } from "../model.service";

function createMockRepo(
  overrides: Record<string, unknown> = {},
): IAgentsRepository {
  const store: Record<string, unknown> = {
    version: 2,
    provider: { litellm: { name: "", ownedBy: "", baseUrl: "", apiKey: "" } },
    models: {},
    agents: {},
    categories: {},
  };
  const data = { ...store, ...overrides };
  return {
    read: async () => data,
    write: async (config: Record<string, unknown>) =>
      Object.assign(data, config),
    readSync: () => data,
    validate: ((_config: unknown): _config is never =>
      true) as IAgentsRepository["validate"],
    exists: async () => true,
    getPath: () => "/tmp/test.json",
  } as unknown as IAgentsRepository;
}

describe("ModelService", () => {
  describe("getAll", () => {
    it("retorna todos os modelos", async () => {
      const models: Record<string, ModelSpec> = {
        "gpt-4": {
          enabled: true,
          displayName: "GPT-4",
          limits: { length: 128000, maxOutput: 4096 },
        },
      };
      const repo = createMockRepo({ models });
      const service = new ModelService({ repository: repo });
      expect(await service.getAll()).toEqual(models);
    });

    it("retorna objeto vazio quando não há modelos", async () => {
      const repo = createMockRepo({ models: {} });
      const service = new ModelService({ repository: repo });
      expect(await service.getAll()).toEqual({});
    });
  });

  describe("get", () => {
    it("retorna modelo específico", async () => {
      const repo = createMockRepo({
        models: {
          "gpt-4": {
            enabled: true,
            displayName: "GPT-4",
            limits: { length: 128000, maxOutput: 4096 },
          },
        },
      });
      const service = new ModelService({ repository: repo });
      const result = await service.get("gpt-4");
      expect(result?.displayName).toBe("GPT-4");
    });

    it("retorna undefined para modelo inexistente", async () => {
      const repo = createMockRepo({ models: {} });
      const service = new ModelService({ repository: repo });
      expect(await service.get("nonexistent")).toBeUndefined();
    });
  });

  describe("create", () => {
    it("adiciona modelo ao repositório", async () => {
      const repo = createMockRepo({ models: {} });
      const service = new ModelService({ repository: repo });
      const spec: ModelSpec = {
        enabled: true,
        displayName: "Claude 3.5",
        limits: { length: 200000, maxOutput: 8192 },
      };
      await service.create("claude-3.5", spec);
      expect(await service.get("claude-3.5")).toEqual(spec);
    });

    it("lança erro se modelo já existe", async () => {
      const repo = createMockRepo({
        models: {
          "gpt-4": {
            enabled: true,
            displayName: "GPT-4",
            limits: { length: 128000, maxOutput: 4096 },
          },
        },
      });
      const service = new ModelService({ repository: repo });
      await expect(
        service.create("gpt-4", {
          enabled: true,
          displayName: "GPT-4",
          limits: { length: 128000, maxOutput: 4096 },
        }),
      ).rejects.toThrow("already exists");
    });
  });

  describe("update", () => {
    it("atualiza modelo existente com merge parcial", async () => {
      const repo = createMockRepo({
        models: {
          "gpt-4": {
            enabled: true,
            displayName: "GPT-4",
            limits: { length: 128000, maxOutput: 4096 },
          },
        },
      });
      const service = new ModelService({ repository: repo });
      await service.update("gpt-4", {
        limits: { length: 128000, maxOutput: 8192 },
      });
      const result = await service.get("gpt-4");
      expect(result?.limits.maxOutput).toBe(8192);
      expect(result?.limits.length).toBe(128000);
    });

    it("lança erro se modelo não existe", async () => {
      const repo = createMockRepo({ models: {} });
      const service = new ModelService({ repository: repo });
      await expect(
        service.update("nonexistent", {
          limits: { length: 128000, maxOutput: 8192 },
        }),
      ).rejects.toThrow("not found");
    });
  });

  describe("upsert", () => {
    it("cria modelo se não existe", async () => {
      const repo = createMockRepo({ models: {} });
      const service = new ModelService({ repository: repo });
      const spec: ModelSpec = {
        enabled: true,
        displayName: "GPT-4o",
        limits: { length: 128000, maxOutput: 16384 },
      };
      await service.upsert("gpt-4o", spec);
      expect(await service.get("gpt-4o")).toEqual(spec);
    });

    it("atualiza modelo se já existe", async () => {
      const repo = createMockRepo({
        models: {
          "gpt-4": {
            enabled: true,
            displayName: "GPT-4",
            limits: { length: 128000, maxOutput: 4096 },
          },
        },
      });
      const service = new ModelService({ repository: repo });
      await service.upsert("gpt-4", {
        enabled: true,
        displayName: "GPT-4 Updated",
        limits: { length: 128000, maxOutput: 8192 },
      });
      expect((await service.get("gpt-4"))?.displayName).toBe("GPT-4 Updated");
    });
  });

  describe("delete", () => {
    it("remove modelo existente", async () => {
      const repo = createMockRepo({
        models: {
          "gpt-4": {
            enabled: true,
            displayName: "GPT-4",
            limits: { length: 128000, maxOutput: 4096 },
          },
        },
      });
      const service = new ModelService({ repository: repo });
      await service.delete("gpt-4");
      expect(await service.get("gpt-4")).toBeUndefined();
    });

    it("lança erro se modelo não existe", async () => {
      const repo = createMockRepo({ models: {} });
      const service = new ModelService({ repository: repo });
      await expect(service.delete("nonexistent")).rejects.toThrow("not found");
    });
  });

  describe("resolveModelName", () => {
    it("retorna key se for modelo direto", async () => {
      const repo = createMockRepo({
        models: {
          "gpt-4": {
            enabled: true,
            displayName: "GPT-4",
            limits: { length: 128000, maxOutput: 4096 },
          },
        },
      });
      const service = new ModelService({ repository: repo });
      expect(await service.resolveModelName("gpt-4")).toBe("gpt-4");
    });

    it("retorna key como-is se não encontrado", async () => {
      const repo = createMockRepo({});
      const service = new ModelService({ repository: repo });
      expect(await service.resolveModelName("unknown")).toBe("unknown");
    });
  });
});
