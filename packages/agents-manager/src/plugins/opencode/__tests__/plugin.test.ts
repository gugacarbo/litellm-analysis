import type {
  PluginRouting,
  SystemAgent,
} from "@lite-llm/agents-repository/schemas";
import { describe, expect, it } from "vitest";
import { OpenCodePlugin } from "../plugin";

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
    it("retorna array vazio (sem agentes internos)", () => {
      const plugin = new OpenCodePlugin();
      const agents = plugin.getInternalAgents();
      expect(agents).toHaveLength(0);
      expect(agents).toEqual([]);
    });
  });

  describe("getConfigSchema", () => {
    it("retorna 2 campos de configuração", () => {
      const plugin = new OpenCodePlugin();
      const schema = plugin.getConfigSchema();
      expect(schema).toHaveLength(3);
    });

    it("campos tem key, type e label", () => {
      const plugin = new OpenCodePlugin();
      const schema = plugin.getConfigSchema();
      expect(schema[0].key).toBe("defaultModel");
      expect(schema[0].type).toBe("string");
      expect(schema[1].key).toBe("defaultTemperature");
      expect(schema[1].type).toBe("number");
      expect(schema[2].key).toBe("selectedAgents");
      expect(schema[2].type).toBe("switch-group");
      expect(schema[2].label).toBe("System Agents");
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

    it("mapeia thinking.levels para variants com reasoningEffort", () => {
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
            "gpt-5": {
              displayName: "GPT-5",
              enabled: true,
              limits: { length: 200000, maxOutput: 8192 },
              thinking: {
                levels: ["low", "medium", "high", "xHigh", "off", "invalid"],
              },
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
      const gpt5 = models["gpt-5"] as Record<string, unknown>;
      const variants = gpt5.variants as Record<string, unknown>;

      expect(Object.keys(variants)).toEqual([
        "low",
        "medium",
        "high",
        "xhigh",
        "none",
      ]);
      expect(variants.xhigh).toEqual({ reasoningEffort: "xhigh" });
    });

    it("inclui agentes habilitados no routing na seção agents", () => {
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
        routing: { agents: { Builder: "Builder" }, categories: {} },
      };

      const output = plugin.buildOutput(agents, routing, {
        allModels: {},
        litellmConfig: {
          baseUrl: "http://localhost:4000",
          apiKey: "test-key",
        },
      }) as unknown as Record<string, unknown>;

      const agentsOut = output.agents as Record<string, unknown>;
      expect(agentsOut).toHaveProperty("Builder");
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

    it("usa displayName como chave na seção agents com modelo litellm", () => {
      const plugin = new OpenCodePlugin();
      const agents: SystemAgent[] = [
        {
          displayName: "Loom",
          icon: "🧵",
          description: "Coordinator",
          model: "",
          fallbackModels: [],
          limits: { context: 100000, output: 16000 },
          config: {},
        },
      ];
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "opencode.json",
        routing: { agents: { Loom: "Loom" }, categories: {} },
      };

      const output = plugin.buildOutput(agents, routing, {
        allModels: {},
        litellmConfig: {
          baseUrl: "http://localhost:4000",
          apiKey: "test-key",
        },
      }) as unknown as Record<string, unknown>;

      const agentsOut = output.agents as Record<string, unknown>;
      const loomAgent = agentsOut.Loom as Record<string, unknown>;

      expect(loomAgent.description).toBe("Coordinator");
      expect(loomAgent.model).toBe("litellm/Loom");
      expect(loomAgent.temperature).toBe(0.2);
    });

    it("gera seção agents com dados do sistema", () => {
      const plugin = new OpenCodePlugin();
      const agents: SystemAgent[] = [
        {
          displayName: "Loom",
          icon: "🧵",
          description: "Coordinator agent",
          model: "gpt-4",
          fallbackModels: ["gpt-3.5-turbo"],
          limits: { context: 200000, output: 32768 },
          config: { temperature: 0.7 },
        },
      ];
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "opencode.json",
        routing: { agents: { Loom: "Loom" }, categories: {} },
      };

      const output = plugin.buildOutput(agents, routing, {
        allModels: {},
        litellmConfig: {
          baseUrl: "http://localhost:4000",
          apiKey: "test-key",
        },
      }) as unknown as Record<string, unknown>;

      const agentsOut = output.agents as Record<string, unknown>;
      const loomAgent = agentsOut.Loom as Record<string, unknown>;

      expect(loomAgent.description).toBe("Coordinator agent");
      expect(loomAgent.model).toBe("litellm/gpt-4");
      expect(loomAgent.fallback_models).toEqual(["gpt-3.5-turbo"]);
      expect(loomAgent.temperature).toBe(0.7);
    });

    it("agent sem model usa litellm/displayName como fallback", () => {
      const plugin = new OpenCodePlugin();
      const agents: SystemAgent[] = [makeSystemAgent({ model: "" })];
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "opencode.json",
        routing: { agents: { Builder: "Builder" }, categories: {} },
      };

      const output = plugin.buildOutput(agents, routing, {
        allModels: {},
        litellmConfig: {
          baseUrl: "http://localhost:4000",
          apiKey: "test-key",
        },
      }) as unknown as Record<string, unknown>;

      const agentsOut = output.agents as Record<string, unknown>;
      const builderAgent = agentsOut.Builder as Record<string, unknown>;
      expect(builderAgent.model).toBe("litellm/Builder");
    });

    it("usa defaultModel do config como fallback quando agent não tem model", () => {
      const plugin = new OpenCodePlugin();
      const agents: SystemAgent[] = [makeSystemAgent({ model: "" })];
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "opencode.json",
        config: { defaultModel: "gpt-4" },
        routing: { agents: { Builder: "Builder" }, categories: {} },
      };

      const output = plugin.buildOutput(agents, routing, {
        allModels: {},
        litellmConfig: {
          baseUrl: "http://localhost:4000",
          apiKey: "test-key",
        },
      }) as unknown as Record<string, unknown>;

      const agentsOut = output.agents as Record<string, unknown>;
      const builderAgent = agentsOut.Builder as Record<string, unknown>;
      expect(builderAgent.model).toBe("litellm/gpt-4");
    });

    it("agent com model próprio ignora defaultModel do config", () => {
      const plugin = new OpenCodePlugin();
      const agents: SystemAgent[] = [makeSystemAgent({ model: "claude-3" })];
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "opencode.json",
        config: { defaultModel: "gpt-4" },
        routing: { agents: { Builder: "Builder" }, categories: {} },
      };

      const output = plugin.buildOutput(agents, routing, {
        allModels: {},
        litellmConfig: {
          baseUrl: "http://localhost:4000",
          apiKey: "test-key",
        },
      }) as unknown as Record<string, unknown>;

      const agentsOut = output.agents as Record<string, unknown>;
      const builderAgent = agentsOut.Builder as Record<string, unknown>;
      expect(builderAgent.model).toBe("litellm/claude-3");
    });

    it("usa defaultTemperature do config quando agent não tem", () => {
      const plugin = new OpenCodePlugin();
      const agents: SystemAgent[] = [makeSystemAgent({ config: {} })];
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "opencode.json",
        config: { defaultTemperature: 0.9 },
        routing: { agents: { Builder: "Builder" }, categories: {} },
      };

      const output = plugin.buildOutput(agents, routing, {
        allModels: {},
        litellmConfig: {
          baseUrl: "http://localhost:4000",
          apiKey: "test-key",
        },
      }) as unknown as Record<string, unknown>;

      const agentsOut = output.agents as Record<string, unknown>;
      const builderAgent = agentsOut.Builder as Record<string, unknown>;
      expect(builderAgent.temperature).toBe(0.9);
    });

    it("agent com temperature próprio ignora defaultTemperature do config", () => {
      const plugin = new OpenCodePlugin();
      const agents: SystemAgent[] = [
        makeSystemAgent({ config: { temperature: 0.3 } }),
      ];
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "opencode.json",
        config: { defaultTemperature: 0.9 },
        routing: { agents: { Builder: "Builder" }, categories: {} },
      };

      const output = plugin.buildOutput(agents, routing, {
        allModels: {},
        litellmConfig: {
          baseUrl: "http://localhost:4000",
          apiKey: "test-key",
        },
      }) as unknown as Record<string, unknown>;

      const agentsOut = output.agents as Record<string, unknown>;
      const builderAgent = agentsOut.Builder as Record<string, unknown>;
      expect(builderAgent.temperature).toBe(0.3);
    });

    it("usa defaultModel do config em categorias sem model", () => {
      const plugin = new OpenCodePlugin();
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "opencode.json",
        config: { defaultModel: "gpt-4" },
        routing: {
          agents: {},
          categories: { code: true },
        },
      };

      const output = plugin.buildOutput([], routing, {
        allModels: {},
        litellmConfig: {
          baseUrl: "http://localhost:4000",
          apiKey: "test-key",
        },
        allCategories: {
          code: {
            displayName: "Code",
            description: "Coding",
            model: "",
            limits: { context: 200000, output: 32768 },
          },
        },
      }) as unknown as Record<string, unknown>;

      const categories = output.categories as Record<string, unknown>;
      const codeCategory = categories.code as Record<string, unknown>;
      expect(codeCategory.model).toBe("litellm/gpt-4");
    });

    it("filtra categorias pelo routing", () => {
      const plugin = new OpenCodePlugin();
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "opencode.json",
        routing: {
          agents: {},
          categories: { code: true, docs: false, review: true },
        },
      };

      const output = plugin.buildOutput([], routing, {
        allModels: {},
        litellmConfig: {
          baseUrl: "http://localhost:4000",
          apiKey: "test-key",
        },
        allCategories: {
          code: {
            displayName: "Code",
            description: "Coding tasks",
            model: "gpt-4",
            limits: { context: 200000, output: 32768 },
          },
          docs: {
            displayName: "Docs",
            description: "Documentation tasks",
            model: "gpt-3.5",
            limits: { context: 100000, output: 16000 },
          },
          review: {
            displayName: "Review",
            description: "Code review tasks",
            model: "gpt-4",
            limits: { context: 200000, output: 32768 },
          },
        },
      }) as unknown as Record<string, unknown>;

      const categories = output.categories as Record<string, unknown>;
      expect(Object.keys(categories)).toEqual(["code", "review"]);
      expect(categories).not.toHaveProperty("docs");
    });

    it("sem routing de categorias, não gera seção category", () => {
      const plugin = new OpenCodePlugin();
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "opencode.json",
        routing: { agents: {}, categories: {} },
      };

      const output = plugin.buildOutput([], routing, {
        allModels: {},
        litellmConfig: {
          baseUrl: "http://localhost:4000",
          apiKey: "test-key",
        },
        allCategories: {
          code: {
            displayName: "Code",
            description: "Coding tasks",
            model: "gpt-4",
            limits: { context: 200000, output: 32768 },
          },
        },
      }) as unknown as Record<string, unknown>;

      expect(output).not.toHaveProperty("categories");
    });

    it("só inclui agentes whose displayName is a key in routing.agents", () => {
      const plugin = new OpenCodePlugin();
      const agents: SystemAgent[] = [
        {
          displayName: "Loom",
          icon: "🧵",
          description: "Coordinator",
          model: "gpt-4",
          fallbackModels: [],
          limits: { context: 100000, output: 16000 },
          config: {},
        },
        {
          displayName: "Tapestry",
          icon: "🧶",
          description: "Architect",
          model: "claude-3",
          fallbackModels: [],
          limits: { context: 100000, output: 16000 },
          config: {},
        },
        {
          displayName: "Thread",
          icon: "🧵",
          description: "Writer",
          model: "gpt-3.5",
          fallbackModels: [],
          limits: { context: 100000, output: 16000 },
          config: {},
        },
      ];
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "opencode.json",
        routing: { agents: { Loom: "Loom", Thread: "Thread" }, categories: {} },
      };

      const output = plugin.buildOutput(agents, routing, {
        allModels: {},
        litellmConfig: {
          baseUrl: "http://localhost:4000",
          apiKey: "test-key",
        },
      }) as unknown as Record<string, unknown>;

      const agentsOut = output.agents as Record<string, unknown>;
      expect(Object.keys(agentsOut)).toEqual(["Loom", "Thread"]);
      expect(agentsOut).toHaveProperty("Loom");
      expect(agentsOut).toHaveProperty("Thread");
      expect(agentsOut).not.toHaveProperty("Tapestry");
    });

    it("routing.agents vazio não gera seção agents (sem retrocompatibilidade)", () => {
      const plugin = new OpenCodePlugin();
      const agents: SystemAgent[] = [
        {
          displayName: "Loom",
          icon: "🧵",
          description: "Coordinator",
          model: "gpt-4",
          fallbackModels: [],
          limits: { context: 100000, output: 16000 },
          config: {},
        },
        {
          displayName: "Tapestry",
          icon: "🧶",
          description: "Architect",
          model: "claude-3",
          fallbackModels: [],
          limits: { context: 100000, output: 16000 },
          config: {},
        },
      ];
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "opencode.json",
        routing: { agents: {}, categories: {} },
      };

      const output = plugin.buildOutput(agents, routing, {
        allModels: {},
        litellmConfig: {
          baseUrl: "http://localhost:4000",
          apiKey: "test-key",
        },
      }) as unknown as Record<string, unknown>;

      expect(output).not.toHaveProperty("agents");
    });
  });
});
