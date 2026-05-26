import { describe, expect, it } from "vitest";
import type { PluginRouting, SystemAgent } from "../../../types";
import { OpenCodePlugin } from "../plugin";

function makeSystemAgent(overrides: Partial<SystemAgent> = {}): SystemAgent {
  return {
    id: "Builder",
    displayName: "Builder",
    icon: "🔧",
    description: "Build stuff",
    limits: { context: 200000, output: 32768 },
    model: "gpt-4",
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

  describe("getConfigSchema (removed)", () => {
    it.skip("getConfigSchema was removed - config validation is now done via Zod schemas", () => {
      // No longer needed - config is validated by Zod schemas
    });
  });

  describe("getOutputFile", () => {
    it("retorna opencode.json", () => {
      const plugin = new OpenCodePlugin();
      expect(plugin.getOutputFile()).toBe("opencode.json");
    });
  });

  describe("buildOutput", () => {
    // ── LiteLLM provider ──

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

    // ── llm-agents aggregate provider ──

    it("gera provider por agente com modelo principal (gpt-5.5)", () => {
      const plugin = new OpenCodePlugin();
      const agents: SystemAgent[] = [
        makeSystemAgent({ id: "sisyphus", model: "gpt-4" }),
      ];
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "opencode.json",
        routing: { agents: { sisyphus: "sisyphus" }, categories: {} },
      };

      const output = plugin.buildOutput(agents, routing, {
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
      }) as unknown as Record<string, unknown>;

      const provider = output.provider as Record<string, unknown>;
      expect(provider).toHaveProperty("llm-agents");

      const llmAgents = provider["llm-agents"] as Record<string, unknown>;
      const models = llmAgents.models as Record<string, unknown>;
      expect(models).toHaveProperty("sisyphus/gpt-5.5");

      const primaryModel = models["sisyphus/gpt-5.5"] as Record<
        string,
        unknown
      >;
      expect(primaryModel.id).toBe("sisyphus/gpt-5.5");
      expect(primaryModel.name).toBe("Builder");
      expect(primaryModel.limit).toEqual({ context: 128000, output: 4096 });
    });

    it("gera slots de fallback quando globalFallbackModel definido", () => {
      const plugin = new OpenCodePlugin();
      const agents: SystemAgent[] = [
        makeSystemAgent({
          id: "sisyphus",
          model: "gpt-4",
        }),
      ];
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "opencode.json",
        routing: { agents: { sisyphus: "sisyphus" }, categories: {} },
      };

      const output = plugin.buildOutput(agents, routing, {
        allModels: {
          "gpt-4": {
            displayName: "GPT-4",
            enabled: true,
            limits: { length: 128000, maxOutput: 4096 },
          },
          "gpt-3.5": {
            displayName: "GPT-3.5",
            enabled: true,
            limits: { length: 16000, maxOutput: 4096 },
          },
        },
        globalFallbackModel: "gpt-3.5",
        litellmConfig: {
          baseUrl: "http://localhost:4000",
          apiKey: "test-key",
        },
      }) as unknown as Record<string, unknown>;

      const provider = output.provider as Record<string, unknown>;
      const llmAgents = provider["llm-agents"] as Record<string, unknown>;
      const models = llmAgents.models as Record<string, unknown>;

      expect(models).toHaveProperty("sisyphus/gpt-5.5");
      expect(models).toHaveProperty("sisyphus/gpt-5.4");

      const fallbackSlot = models["sisyphus/gpt-5.4"] as Record<
        string,
        unknown
      >;
      expect(fallbackSlot.name).toBe("Builder 1");
      expect(fallbackSlot.limit).toEqual({ context: 16000, output: 4096 });
    });

    it("sem globalFallbackModel gera apenas slot primario", () => {
      const plugin = new OpenCodePlugin();
      const agents: SystemAgent[] = [
        makeSystemAgent({
          id: "sisyphus",
          model: "gpt-4",
        }),
      ];
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "opencode.json",
        routing: { agents: { sisyphus: "sisyphus" }, categories: {} },
      };

      const output = plugin.buildOutput(agents, routing, {
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
      }) as unknown as Record<string, unknown>;

      const provider = output.provider as Record<string, unknown>;
      const llmAgents = provider["llm-agents"] as Record<string, unknown>;
      const models = llmAgents.models as Record<string, unknown>;

      expect(models).toHaveProperty("sisyphus/gpt-5.5");
      expect(models).not.toHaveProperty("sisyphus/gpt-5.4");
    });

    it("agent sem model usa defaultModel do config", () => {
      const plugin = new OpenCodePlugin();
      const agents: SystemAgent[] = [
        makeSystemAgent({ id: "sisyphus", model: "" }),
      ];
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "opencode.json",
        config: { defaultModel: "gpt-4" },
        routing: { agents: { sisyphus: "sisyphus" }, categories: {} },
      };

      const output = plugin.buildOutput(agents, routing, {
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
      }) as unknown as Record<string, unknown>;

      const provider = output.provider as Record<string, unknown>;
      const llmAgents = provider["llm-agents"] as Record<string, unknown>;
      const models = llmAgents.models as Record<string, unknown>;
      expect(models).toHaveProperty("sisyphus/gpt-5.5");
    });

    it("agent com model proprio ignora defaultModel do config", () => {
      const plugin = new OpenCodePlugin();
      const agents: SystemAgent[] = [
        makeSystemAgent({ id: "sisyphus", model: "claude-3" }),
      ];
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "opencode.json",
        config: { defaultModel: "gpt-4" },
        routing: { agents: { sisyphus: "sisyphus" }, categories: {} },
      };

      const output = plugin.buildOutput(agents, routing, {
        allModels: {
          "gpt-4": {
            displayName: "GPT-4",
            enabled: true,
            limits: { length: 128000, maxOutput: 4096 },
          },
          "claude-3": {
            displayName: "Claude 3",
            enabled: true,
            limits: { length: 200000, maxOutput: 8192 },
          },
        },
        litellmConfig: {
          baseUrl: "http://localhost:4000",
          apiKey: "test-key",
        },
      }) as unknown as Record<string, unknown>;

      const provider = output.provider as Record<string, unknown>;
      const llmAgents = provider["llm-agents"] as Record<string, unknown>;
      const models = llmAgents.models as Record<string, unknown>;
      const primary = models["sisyphus/gpt-5.5"] as Record<string, unknown>;
      expect(primary.id).toBe("sisyphus/gpt-5.5");
      expect(primary.name).toBe("Builder");
    });

    it("inclui cost e variants no modelo do agente quando disponivel", () => {
      const plugin = new OpenCodePlugin();
      const agents: SystemAgent[] = [
        makeSystemAgent({ id: "sisyphus", model: "gpt-5" }),
      ];
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "opencode.json",
        routing: { agents: { sisyphus: "sisyphus" }, categories: {} },
      };

      const output = plugin.buildOutput(agents, routing, {
        allModels: {
          "gpt-5": {
            displayName: "GPT-5",
            enabled: true,
            limits: { length: 200000, maxOutput: 8192 },
            cost: { input: 15, output: 60 },
            thinking: { levels: ["high"] },
          },
        },
        litellmConfig: {
          baseUrl: "http://localhost:4000",
          apiKey: "test-key",
        },
      }) as unknown as Record<string, unknown>;

      const provider = output.provider as Record<string, unknown>;
      const llmAgents = provider["llm-agents"] as Record<string, unknown>;
      const models = llmAgents.models as Record<string, unknown>;
      const primary = models["sisyphus/gpt-5.5"] as Record<string, unknown>;

      expect(primary.cost).toEqual({ input: 15, output: 60 });
      expect(primary.variants).toEqual({
        high: { reasoningEffort: "high" },
      });
    });

    it("ignora agentes sem mapeamento no routing", () => {
      const plugin = new OpenCodePlugin();
      const agents: SystemAgent[] = [makeSystemAgent({ id: "unused" })];

      const output = plugin.buildOutput(
        agents,
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
      // Only litellm provider should exist
      expect(Object.keys(provider)).toEqual(["litellm"]);
    });

    it("filtra agentes pelo routing (so inclui mapeados)", () => {
      const plugin = new OpenCodePlugin();
      const agents: SystemAgent[] = [
        makeSystemAgent({ id: "sisyphus", model: "gpt-4" }),
        makeSystemAgent({ id: "oracle", model: "claude-3" }),
        makeSystemAgent({ id: "unused", model: "gpt-3.5" }),
      ];
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "opencode.json",
        routing: {
          agents: { sisyphus: "sisyphus", oracle: "oracle" },
          categories: {},
        },
      };

      const output = plugin.buildOutput(agents, routing, {
        allModels: {
          "gpt-4": {
            displayName: "GPT-4",
            enabled: true,
            limits: { length: 128000, maxOutput: 4096 },
          },
          "claude-3": {
            displayName: "Claude 3",
            enabled: true,
            limits: { length: 200000, maxOutput: 8192 },
          },
          "gpt-3.5": {
            displayName: "GPT-3.5",
            enabled: true,
            limits: { length: 16000, maxOutput: 4096 },
          },
        },
        litellmConfig: {
          baseUrl: "http://localhost:4000",
          apiKey: "test-key",
        },
      }) as unknown as Record<string, unknown>;

      const provider = output.provider as Record<string, unknown>;
      const providerKeys = Object.keys(provider);
      expect(providerKeys).toContain("litellm");
      expect(providerKeys).toContain("llm-agents");
      expect(providerKeys).not.toContain("sisyphus");
      expect(providerKeys).not.toContain("oracle");
      expect(providerKeys).not.toContain("unused");

      // Both mapped agents appear inside llm-agents.models
      const llmAgents = provider["llm-agents"] as Record<string, unknown>;
      const models = llmAgents.models as Record<string, unknown>;
      expect(models).toHaveProperty("sisyphus/gpt-5.5");
      expect(models).toHaveProperty("oracle/gpt-5.5");
    });

    it("routing agents vazio nao gera per-agent providers", () => {
      const plugin = new OpenCodePlugin();
      const agents: SystemAgent[] = [
        makeSystemAgent({ id: "sisyphus", model: "gpt-4" }),
      ];
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "opencode.json",
        routing: { agents: {}, categories: {} },
      };

      const output = plugin.buildOutput(agents, routing, {
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
      }) as unknown as Record<string, unknown>;

      const provider = output.provider as Record<string, unknown>;
      expect(Object.keys(provider)).toEqual(["litellm"]);
    });

    // ── Global fallback provider ──

    it("gera global-fallback provider quando globalFallbackModel definido", () => {
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
          globalFallbackModel: "gpt-4",
          litellmConfig: {
            baseUrl: "http://localhost:4000",
            apiKey: "test-key",
          },
        },
      ) as unknown as Record<string, unknown>;

      const provider = output.provider as Record<string, unknown>;
      expect(provider).toHaveProperty("global-fallback");

      const fallbackProvider = provider["global-fallback"] as Record<
        string,
        unknown
      >;
      expect(fallbackProvider.npm).toBe("@ai-sdk/openai-compatible");

      const models = fallbackProvider.models as Record<string, unknown>;
      expect(models).toHaveProperty("global-fallback/gpt-5.5");
      expect(models).not.toHaveProperty("gpt-5.5");
      expect(models).not.toHaveProperty("gpt-5.4");
      expect(models).not.toHaveProperty("gpt-5.3");

      const model = models["global-fallback/gpt-5.5"] as Record<
        string,
        unknown
      >;
      expect(model.id).toBe("global-fallback/gpt-5.5");
      expect(model.name).toBe("Global Fallback");
      expect(model.limit).toEqual({ context: 128000, output: 4096 });
    });

    it("nao gera global-fallback provider sem globalFallbackModel", () => {
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
      expect(provider).not.toHaveProperty("global-fallback");
    });

    it("nao gera global-fallback provider se modelo nao existe em allModels", () => {
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
          globalFallbackModel: "unknown-model",
          litellmConfig: {
            baseUrl: "http://localhost:4000",
            apiKey: "test-key",
          },
        },
      ) as unknown as Record<string, unknown>;

      const provider = output.provider as Record<string, unknown>;
      expect(provider).not.toHaveProperty("global-fallback");
    });

    // ── llm-categories aggregate provider ──

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
        allCategories: {
          code: {
            displayName: "Code",
            description: "Coding",
            model: "",
            limits: { context: 200000, output: 32768 },
          },
        },
      }) as unknown as Record<string, unknown>;

      const provider = output.provider as Record<string, unknown>;
      const llmCategories = provider["llm-categories"] as Record<
        string,
        unknown
      >;
      const models = llmCategories.models as Record<string, unknown>;
      const codeModel = models["code/gpt-5.5"] as Record<string, unknown>;
      expect(codeModel).toBeDefined();
      expect(codeModel.id).toBe("code/gpt-5.5");
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
        allModels: {
          "gpt-4": {
            displayName: "GPT-4",
            enabled: true,
            limits: { length: 128000, maxOutput: 4096 },
          },
          "gpt-3.5": {
            displayName: "GPT-3.5",
            enabled: true,
            limits: { length: 16000, maxOutput: 4096 },
          },
        },
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

      const provider = output.provider as Record<string, unknown>;
      const llmCategories = provider["llm-categories"] as Record<
        string,
        unknown
      >;
      const models = llmCategories.models as Record<string, unknown>;
      expect(Object.keys(models)).toEqual(["code/gpt-5.5", "review/gpt-5.5"]);
      expect(models).not.toHaveProperty("docs/gpt-5.5");
    });

    it("routing de categorias vazio inclui todas as categorias", () => {
      const plugin = new OpenCodePlugin();
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "opencode.json",
        routing: { agents: {}, categories: {} },
      };

      const output = plugin.buildOutput([], routing, {
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
        allCategories: {
          code: {
            displayName: "Code",
            description: "Coding tasks",
            model: "gpt-4",
            limits: { context: 200000, output: 32768 },
          },
        },
      }) as unknown as Record<string, unknown>;

      const provider = output.provider as Record<string, unknown>;
      expect(provider).toHaveProperty("llm-categories");
      const llmCategories = provider["llm-categories"] as Record<
        string,
        unknown
      >;
      const models = llmCategories.models as Record<string, unknown>;
      expect(models).toHaveProperty("code/gpt-5.5");
    });

    // ── No agents section ──

    it("nao gera secao agents (deprecated)", () => {
      const plugin = new OpenCodePlugin();
      const agents: SystemAgent[] = [
        makeSystemAgent({ id: "sisyphus", model: "gpt-4" }),
      ];
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "opencode.json",
        routing: { agents: { sisyphus: "sisyphus" }, categories: {} },
      };

      const output = plugin.buildOutput(agents, routing, {
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
      }) as unknown as Record<string, unknown>;

      const provider = output.provider as Record<string, unknown>;
      // Agents should appear inside llm-agents provider, not as a separate output.agents
      expect(provider).toHaveProperty("llm-agents");
      const llmAgents = provider["llm-agents"] as Record<string, unknown>;
      const models = llmAgents.models as Record<string, unknown>;
      expect(models).toHaveProperty("sisyphus/gpt-5.5");
      expect(provider).not.toHaveProperty("sisyphus");
    });
  });
});
