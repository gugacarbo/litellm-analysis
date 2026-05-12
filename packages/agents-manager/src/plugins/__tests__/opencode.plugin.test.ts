import type {
  PluginRouting,
  SystemAgent,
} from "@lite-llm/agents-repository/schemas";
import { describe, expect, it } from "vitest";
import { OpenCodePlugin } from "../builtins/opencode.plugin";

function makeSystemAgent(overrides: Partial<SystemAgent> = {}): SystemAgent {
  return {
    displayName: "Builder",
    icon: "🔧",
    description: "Build stuff",
    limits: { context: 200000, output: 32768 },
    model: "gpt-4",
    fallbackModels: [],
    config: {},
    ...overrides,
  };
}

describe("OpenCodePlugin", () => {
  describe("metadata", () => {
    it("tem id, name e version corretos", () => {
      const plugin = new OpenCodePlugin();
      expect(plugin.id).toBe("opencode");
      expect(plugin.name).toBe("OpenCode AI SDK");
      expect(plugin.version).toBe(1);
    });
  });

  describe("getInternalAgents", () => {
    it("retorna 6 agentes internos", () => {
      const plugin = new OpenCodePlugin();
      const agents = plugin.getInternalAgents();
      expect(agents).toHaveLength(6);
    });

    it("retorna ids corretos", () => {
      const plugin = new OpenCodePlugin();
      const ids = plugin.getInternalAgents().map((a) => a.id);
      expect(ids).toEqual([
        "coder",
        "planner",
        "explorer",
        "reviewer",
        "writer",
        "architect",
      ]);
    });

    it("cada agente tem displayName e description", () => {
      const plugin = new OpenCodePlugin();
      for (const agent of plugin.getInternalAgents()) {
        expect(agent.displayName).toBeTruthy();
        expect(agent.description).toBeTruthy();
      }
    });
  });

  describe("getConfigSchema", () => {
    it("retorna schema vazio (sem configuração adicional)", () => {
      const plugin = new OpenCodePlugin();
      const schema = plugin.getConfigSchema();
      expect(schema).toHaveLength(0);
    });
  });

  describe("getOutputFile", () => {
    it("retorna opencode.json", () => {
      const plugin = new OpenCodePlugin();
      expect(plugin.getOutputFile()).toBe("opencode.json");
    });
  });

  describe("buildOutput", () => {
    it("gera estrutura com provider litellm", () => {
      const plugin = new OpenCodePlugin();
      const output = plugin.buildOutput(
        [],
        {
          enabled: true,
          outputFile: "opencode.json",
          routing: { agents: {}, categories: {} },
        },
        {
          allModels: {
            "gpt-4": {
              displayName: "GPT-4",
              enabled: true,
              limits: { length: 128000, maxOutput: 4096 },
            },
          },
          litellmConfig: {
            baseUrl: "http://localhost:4000/v1",
            apiKey: "test-key",
          },
        },
      );
      expect(output).toHaveProperty("provider");
      expect(
        (output as unknown as Record<string, unknown>).provider,
      ).toHaveProperty("litellm");
    });

    it("inclui modelos litellm com limites corretos", () => {
      const plugin = new OpenCodePlugin();
      const output = plugin.buildOutput(
        [],
        {
          enabled: true,
          outputFile: "opencode.json",
          routing: { agents: {}, categories: {} },
        },
        {
          allModels: {
            "gpt-4": {
              displayName: "GPT-4",
              enabled: true,
              limits: { length: 128000, maxOutput: 4096 },
            },
          },
          litellmConfig: {
            baseUrl: "http://localhost:4000",
            apiKey: "test-key",
          },
        },
      ) as unknown as Record<string, unknown>;

      const provider = output.provider as Record<string, unknown>;
      const litellm = provider.litellm as Record<string, unknown>;
      const models = litellm.models as Record<string, unknown>;
      const gpt4 = models["gpt-4"] as Record<string, unknown>;

      expect(gpt4.name).toBe("GPT-4");
      expect(gpt4.limit).toEqual({
        context: 128000,
        output: 4096,
      });
    });

    it("configura providers para agentes mapeados", () => {
      const plugin = new OpenCodePlugin();
      const agents: SystemAgent[] = [
        {
          displayName: "Builder",
          icon: "🔧",
          description: "Build stuff",
          model: "gpt-4",
          fallbackModels: [],
          limits: { context: 200000, output: 32768 },
          config: {},
        },
      ];
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "opencode.json",
        routing: { agents: { Builder: "coder" }, categories: {} },
      };

      const output = plugin.buildOutput(agents, routing, {
        allModels: {},
        litellmConfig: {
          baseUrl: "http://localhost:4000",
          apiKey: "test-key",
        },
      }) as unknown as Record<string, unknown>;

      const provider = output.provider as Record<string, unknown>;
      expect(provider).toHaveProperty("coder");
    });

    it("ignora agentes sem mapeamento", () => {
      const plugin = new OpenCodePlugin();
      const agents = [makeSystemAgent()];

      const output = plugin.buildOutput(
        agents,
        {
          enabled: true,
          outputFile: "opencode.json",
          routing: { agents: {}, categories: {} },
        },
        {
          allModels: {},
          litellmConfig: {
            baseUrl: "http://localhost:4000",
            apiKey: "test-key",
          },
        },
      ) as unknown as Record<string, unknown>;

      const provider = output.provider as Record<string, unknown>;
      expect(Object.keys(provider)).toEqual(["litellm"]);
    });

    it("configura baseURL e apiKey do litellm", () => {
      const plugin = new OpenCodePlugin();
      const output = plugin.buildOutput(
        [],
        {
          enabled: true,
          outputFile: "opencode.json",
          routing: { agents: {}, categories: {} },
        },
        {
          allModels: {},
          litellmConfig: {
            baseUrl: "http://proxy:4000/v1",
            apiKey: "secret-key",
          },
        },
      ) as unknown as Record<string, unknown>;

      const provider = output.provider as Record<string, unknown>;
      const litellm = provider.litellm as Record<string, unknown>;
      const options = litellm.options as Record<string, unknown>;
      expect(options.baseURL).toBe("http://proxy:4000/v1");
      expect(options.apiKey).toBe("secret-key");
    });
  });
});
