import type {
  PluginRoutingConfig,
  SystemAgent,
} from "@lite-llm/agents-repository/schema";
import { describe, expect, it } from "vitest";
import { OpenCodePlugin } from "../builtins/opencode.plugin";

function makeSystemAgent(overrides: Partial<SystemAgent> = {}): SystemAgent {
  return {
    id: "builder",
    displayName: "Builder",
    icon: "🔧",
    description: "Build stuff",
    versions: [],
    model: "gpt-4",
    fallbackModels: [],
    enabledPlugins: [],
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
    it("retorna schema com campos", () => {
      const plugin = new OpenCodePlugin();
      const schema = plugin.getConfigSchema();
      expect(schema.length).toBeGreaterThan(0);
    });

    it("primeiro campo é defaultVersion do tipo select", () => {
      const plugin = new OpenCodePlugin();
      const schema = plugin.getConfigSchema();
      expect(schema[0].key).toBe("defaultVersion");
      expect(schema[0].type).toBe("select");
      expect(schema[0].options).toHaveLength(2);
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
        { version: 1, plugins: {} },
        {
          allModels: {
            "gpt-4": {
              displayName: "GPT-4",
              contextLength: 128000,
              maxOutput: 4096,
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
        { version: 1, plugins: {} },
        {
          allModels: {
            "gpt-4": {
              displayName: "GPT-4",
              contextLength: 128000,
              maxOutput: 4096,
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
      const agents = [
        makeSystemAgent({
          id: "builder",
          versions: [
            {
              id: "fast",
              displayName: "Fast",
              modelIdStrategy: "model-name",
              limits: { context: 16000, output: 2048 },
            },
          ],
        }),
      ];
      const routing: PluginRoutingConfig = {
        version: 1,
        plugins: {
          opencode: {
            enabled: true,
            outputFile: "opencode.json",
            agents: {},
            agentMappings: { builder: "coder" },
          },
        },
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
      expect((provider.coder as Record<string, unknown>).models).toHaveProperty(
        "fast",
      );
    });

    it("ignora agentes sem mapeamento", () => {
      const plugin = new OpenCodePlugin();
      const agents = [makeSystemAgent({ id: "builder" })];

      const output = plugin.buildOutput(
        agents,
        { version: 1, plugins: {} },
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
        { version: 1, plugins: {} },
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
