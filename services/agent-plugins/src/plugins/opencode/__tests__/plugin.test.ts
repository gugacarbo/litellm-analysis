import { describe, expect, it } from "vitest";
import type { PluginRouting, SystemAgent } from "../../../types";
import { createOpenCodePlugin } from "../factory/plugin.factory";

function buildOutput(
  plugin: ReturnType<typeof createOpenCodePlugin>,
  agents: SystemAgent[],
  routing: PluginRouting,
  context: Parameters<
    ReturnType<typeof createOpenCodePlugin>["handlers"]["build"]
  >[0]["context"],
) {
  return plugin.handlers.build({
    agents,
    routing: routing as Parameters<
      ReturnType<typeof createOpenCodePlugin>["handlers"]["build"]
    >[0]["routing"],
    context,
  });
}

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

describe("createOpenCodePlugin", () => {
  describe("metadata", () => {
    it("tem id, name e version corretos", () => {
      const plugin = createOpenCodePlugin();
      expect(plugin.manifest.id).toBe("opencode");
      expect(plugin.manifest.displayName).toBe("OpenCode AI SDK");
      expect(plugin.manifest.version).toBe(2);
    });
  });

  describe("getInternalAgents", () => {
    it("retorna array vazio (sem agentes internos)", () => {
      const plugin = createOpenCodePlugin();
      const agents = plugin.manifest.internalAgents;
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
      const plugin = createOpenCodePlugin();
      expect(plugin.manifest.output.fileName).toBe("opencode.json");
    });
  });

  describe("buildOutput", () => {
    // ── Local proxy provider ──

    it("gera estrutura com provider local-proxy", () => {
      const plugin = createOpenCodePlugin();
      const output = buildOutput(
        plugin,
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
              contextLength: 128000,
              maxCompletionTokens: 4096,
            },
          },
          modelProxyConfig: {
            baseUrl: "http://localhost:4000/v1",
            apiKey: "test-key",
          },
        },
      );
      expect(output).toHaveProperty("provider");
      expect(
        (output as unknown as Record<string, unknown>).provider,
      ).toHaveProperty("local-proxy");
    });

    it("inclui modelos local-proxy com limites corretos", () => {
      const plugin = createOpenCodePlugin();
      const output = buildOutput(
        plugin,
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
              contextLength: 128000,
              maxCompletionTokens: 4096,
            },
          },
          modelProxyConfig: {
            baseUrl: "http://localhost:4000",
            apiKey: "test-key",
          },
        },
      ) as unknown as Record<string, unknown>;

      const provider = output.provider as Record<string, unknown>;
      const localProxy = provider["local-proxy"] as Record<string, unknown>;
      const models = localProxy.models as Record<string, unknown>;
      const gpt4 = models["gpt-4"] as Record<string, unknown>;

      expect(gpt4.id).toBe("gpt-4");
      expect(gpt4.name).toBe("GPT-4");
      expect(gpt4.limit).toEqual({
        context: 128000,
        output: 4096,
      });
    });

    it("faz fallback do name para o id do modelo quando displayName vier vazio", () => {
      const plugin = createOpenCodePlugin();
      const output = buildOutput(
        plugin,
        [],
        {
          enabled: true,
          outputFile: "opencode.json",
          routing: { agents: {}, categories: {} },
        },
        {
          allModels: {
            "minimax-m3": {
              displayName: "",
              enabled: true,
              contextLength: 1000000,
              maxCompletionTokens: 256000,
            },
          },
          modelProxyConfig: {
            baseUrl: "http://localhost:4000",
            apiKey: "test-key",
          },
        },
      ) as unknown as Record<string, unknown>;

      const provider = output.provider as Record<string, unknown>;
      const localProxy = provider["local-proxy"] as Record<string, unknown>;
      const models = localProxy.models as Record<string, unknown>;
      const minimax = models["minimax-m3"] as Record<string, unknown>;

      expect(minimax.id).toBe("minimax-m3");
      expect(minimax.name).toBe("minimax-m3");
    });

    it("mapeia reasoning.effort para options e interleaved", () => {
      const plugin = createOpenCodePlugin();
      const output = buildOutput(
        plugin,
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
              contextLength: 200000,
              maxCompletionTokens: 8192,
              reasoning: {
                effort: "high",
              },
            },
          },
          modelProxyConfig: {
            baseUrl: "http://localhost:4000",
            apiKey: "test-key",
          },
        },
      ) as unknown as Record<string, unknown>;

      const provider = output.provider as Record<string, unknown>;
      const localProxy = provider["local-proxy"] as Record<string, unknown>;
      const models = localProxy.models as Record<string, unknown>;
      const gpt5 = models["gpt-5"] as Record<string, unknown>;

      expect(gpt5.reasoning).toBe(true);
      expect(gpt5.options).toEqual({ reasoningEffort: "high" });
      expect(gpt5.interleaved).toEqual({ field: "reasoning_content" });
    });

    it("mapeia reasoning.effort para options.reasoningEffort", () => {
      const plugin = createOpenCodePlugin();
      const output = buildOutput(
        plugin,
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
              contextLength: 200000,
              maxCompletionTokens: 8192,
              reasoning: {
                effort: "high",
              },
            },
          },
          modelProxyConfig: {
            baseUrl: "http://localhost:4000",
            apiKey: "test-key",
          },
        },
      ) as unknown as Record<string, unknown>;

      const provider = output.provider as Record<string, unknown>;
      const localProxy = provider["local-proxy"] as Record<string, unknown>;
      const models = localProxy.models as Record<string, unknown>;
      const gpt5 = models["gpt-5"] as Record<string, unknown>;

      expect(gpt5.reasoning).toBe(true);
      expect(gpt5.options).toEqual({ reasoningEffort: "high" });
      expect(gpt5.interleaved).toEqual({ field: "reasoning_content" });
    });

    it("configura interleaved quando o modelo tem reasoning", () => {
      const plugin = createOpenCodePlugin();
      const output = buildOutput(
        plugin,
        [],
        {
          enabled: true,
          outputFile: "opencode.json",
          routing: { agents: {}, categories: {} },
        },
        {
          allModels: {
            "deepseek-r1": {
              displayName: "DeepSeek R1",
              enabled: true,
              contextLength: 128000,
              maxCompletionTokens: 8192,
              reasoning: {
                effort: "high",
              },
            },
          },
          modelProxyConfig: {
            baseUrl: "http://localhost:4000",
            apiKey: "test-key",
          },
        },
      ) as unknown as Record<string, unknown>;

      const provider = output.provider as Record<string, unknown>;
      const localProxy = provider["local-proxy"] as Record<string, unknown>;
      const models = localProxy.models as Record<string, unknown>;
      const deepseek = models["deepseek-r1"] as Record<string, unknown>;

      expect(deepseek.reasoning).toBe(true);
      expect(deepseek.interleaved).toEqual({
        field: "reasoning_content",
      });
    });

    it("configura baseURL e apiKey do local-proxy", () => {
      const plugin = createOpenCodePlugin();
      const output = buildOutput(
        plugin,
        [],
        {
          enabled: true,
          outputFile: "opencode.json",
          routing: { agents: {}, categories: {} },
        },
        {
          allModels: {},
          modelProxyConfig: {
            baseUrl: "http://proxy:4000/v1",
            apiKey: "secret-key",
          },
        },
      ) as unknown as Record<string, unknown>;

      const provider = output.provider as Record<string, unknown>;
      const localProxy = provider["local-proxy"] as Record<string, unknown>;
      const options = localProxy.options as Record<string, unknown>;
      expect(options.baseURL).toBe("http://proxy:4000/v1");
      expect(options.apiKey).toBe("secret-key");
    });

    // ── llm-agents aggregate provider ──

    it("gera provider por agente com modelo principal (gpt-5.5)", () => {
      const plugin = createOpenCodePlugin();
      const agents: SystemAgent[] = [
        makeSystemAgent({ id: "sisyphus", model: "gpt-4" }),
      ];
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "opencode.json",
        routing: { agents: { sisyphus: "sisyphus" }, categories: {} },
      };

      const output = buildOutput(plugin, agents, routing, {
        allModels: {
          "gpt-4": {
            displayName: "GPT-4",
            enabled: true,
            contextLength: 128000,
            maxCompletionTokens: 4096,
          },
        },
        modelProxyConfig: {
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

    it("globalFallbackModel nao cria slot extra por agente", () => {
      const plugin = createOpenCodePlugin();
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

      const output = buildOutput(plugin, agents, routing, {
        allModels: {
          "gpt-4": {
            displayName: "GPT-4",
            enabled: true,
            contextLength: 128000,
            maxCompletionTokens: 4096,
          },
          "gpt-3.5": {
            displayName: "GPT-3.5",
            enabled: true,
            contextLength: 16000,
            maxCompletionTokens: 4096,
          },
        },
        globalFallbackModel: "gpt-3.5",
        modelProxyConfig: {
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

    it("sem globalFallbackModel gera apenas slot primario", () => {
      const plugin = createOpenCodePlugin();
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

      const output = buildOutput(plugin, agents, routing, {
        allModels: {
          "gpt-4": {
            displayName: "GPT-4",
            enabled: true,
            contextLength: 128000,
            maxCompletionTokens: 4096,
          },
        },
        modelProxyConfig: {
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

    it("agent sem model usa model do config", () => {
      const plugin = createOpenCodePlugin();
      const agents: SystemAgent[] = [
        makeSystemAgent({ id: "sisyphus", model: "" }),
      ];
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "opencode.json",
        config: { model: "gpt-4" },
        routing: { agents: { sisyphus: "sisyphus" }, categories: {} },
      };

      const output = buildOutput(plugin, agents, routing, {
        allModels: {
          "gpt-4": {
            displayName: "GPT-4",
            enabled: true,
            contextLength: 128000,
            maxCompletionTokens: 4096,
          },
        },
        modelProxyConfig: {
          baseUrl: "http://localhost:4000",
          apiKey: "test-key",
        },
      }) as unknown as Record<string, unknown>;

      const provider = output.provider as Record<string, unknown>;
      const llmAgents = provider["llm-agents"] as Record<string, unknown>;
      const models = llmAgents.models as Record<string, unknown>;
      expect(models).toHaveProperty("sisyphus/gpt-5.5");
    });

    it("agent com model proprio ignora model do config", () => {
      const plugin = createOpenCodePlugin();
      const agents: SystemAgent[] = [
        makeSystemAgent({ id: "sisyphus", model: "claude-3" }),
      ];
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "opencode.json",
        config: { model: "gpt-4" },
        routing: { agents: { sisyphus: "sisyphus" }, categories: {} },
      };

      const output = buildOutput(plugin, agents, routing, {
        allModels: {
          "gpt-4": {
            displayName: "GPT-4",
            enabled: true,
            contextLength: 128000,
            maxCompletionTokens: 4096,
          },
          "claude-3": {
            displayName: "Claude 3",
            enabled: true,
            contextLength: 200000,
            maxCompletionTokens: 8192,
          },
        },
        modelProxyConfig: {
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

    it("inclui cost e options no modelo do agente quando disponivel", () => {
      const plugin = createOpenCodePlugin();
      const agents: SystemAgent[] = [
        makeSystemAgent({ id: "sisyphus", model: "gpt-5" }),
      ];
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "opencode.json",
        routing: { agents: { sisyphus: "sisyphus" }, categories: {} },
      };

      const output = buildOutput(plugin, agents, routing, {
        allModels: {
          "gpt-5": {
            displayName: "GPT-5",
            enabled: true,
            contextLength: 200000,
            maxCompletionTokens: 8192,
            pricing: { input: 0.000015, output: 0.00006 },
            reasoning: { effort: "high" },
          },
        },
        modelProxyConfig: {
          baseUrl: "http://localhost:4000",
          apiKey: "test-key",
        },
      }) as unknown as Record<string, unknown>;

      const provider = output.provider as Record<string, unknown>;
      const llmAgents = provider["llm-agents"] as Record<string, unknown>;
      const models = llmAgents.models as Record<string, unknown>;
      const primary = models["sisyphus/gpt-5.5"] as Record<string, unknown>;

      expect(primary.cost).toEqual({ input: 15, output: 60 });
      expect(primary.options).toEqual({ reasoningEffort: "high" });
    });

    it("ignora agentes sem mapeamento no routing", () => {
      const plugin = createOpenCodePlugin();
      const agents: SystemAgent[] = [makeSystemAgent({ id: "unused" })];

      const output = buildOutput(
        plugin,
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
              contextLength: 128000,
              maxCompletionTokens: 4096,
            },
          },
          modelProxyConfig: {
            baseUrl: "http://localhost:4000",
            apiKey: "test-key",
          },
        },
      ) as unknown as Record<string, unknown>;

      const provider = output.provider as Record<string, unknown>;
      // Only local-proxy provider should exist
      expect(Object.keys(provider)).toEqual(["local-proxy"]);
    });

    it("filtra agentes pelo routing (so inclui mapeados)", () => {
      const plugin = createOpenCodePlugin();
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

      const output = buildOutput(plugin, agents, routing, {
        allModels: {
          "gpt-4": {
            displayName: "GPT-4",
            enabled: true,
            contextLength: 128000,
            maxCompletionTokens: 4096,
          },
          "claude-3": {
            displayName: "Claude 3",
            enabled: true,
            contextLength: 200000,
            maxCompletionTokens: 8192,
          },
          "gpt-3.5": {
            displayName: "GPT-3.5",
            enabled: true,
            contextLength: 16000,
            maxCompletionTokens: 4096,
          },
        },
        modelProxyConfig: {
          baseUrl: "http://localhost:4000",
          apiKey: "test-key",
        },
      }) as unknown as Record<string, unknown>;

      const provider = output.provider as Record<string, unknown>;
      const providerKeys = Object.keys(provider);
      expect(providerKeys).toContain("local-proxy");
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
      const plugin = createOpenCodePlugin();
      const agents: SystemAgent[] = [
        makeSystemAgent({ id: "sisyphus", model: "gpt-4" }),
      ];
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "opencode.json",
        routing: { agents: {}, categories: {} },
      };

      const output = buildOutput(plugin, agents, routing, {
        allModels: {
          "gpt-4": {
            displayName: "GPT-4",
            enabled: true,
            contextLength: 128000,
            maxCompletionTokens: 4096,
          },
        },
        modelProxyConfig: {
          baseUrl: "http://localhost:4000",
          apiKey: "test-key",
        },
      }) as unknown as Record<string, unknown>;

      const provider = output.provider as Record<string, unknown>;
      expect(Object.keys(provider)).toEqual(["local-proxy"]);
    });

    // ── Global fallback provider ──

    it("gera global-fallback provider quando globalFallbackModel definido", () => {
      const plugin = createOpenCodePlugin();
      const output = buildOutput(
        plugin,
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
              contextLength: 128000,
              maxCompletionTokens: 4096,
            },
          },
          globalFallbackModel: "gpt-4",
          modelProxyConfig: {
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
      const plugin = createOpenCodePlugin();
      const output = buildOutput(
        plugin,
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
              contextLength: 128000,
              maxCompletionTokens: 4096,
            },
          },
          modelProxyConfig: {
            baseUrl: "http://localhost:4000",
            apiKey: "test-key",
          },
        },
      ) as unknown as Record<string, unknown>;

      const provider = output.provider as Record<string, unknown>;
      expect(provider).not.toHaveProperty("global-fallback");
    });

    it("nao gera global-fallback provider se modelo nao existe em allModels", () => {
      const plugin = createOpenCodePlugin();
      const output = buildOutput(
        plugin,
        [],
        {
          enabled: true,
          outputFile: "opencode.json",
          routing: { agents: {}, categories: {} },
        },
        {
          allModels: {},
          globalFallbackModel: "unknown-model",
          modelProxyConfig: {
            baseUrl: "http://localhost:4000",
            apiKey: "test-key",
          },
        },
      ) as unknown as Record<string, unknown>;

      const provider = output.provider as Record<string, unknown>;
      expect(provider).not.toHaveProperty("global-fallback");
    });

    // ── llm-categories aggregate provider ──

    it("usa model do config em categorias sem model", () => {
      const plugin = createOpenCodePlugin();
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "opencode.json",
        config: { model: "gpt-4" },
        routing: {
          agents: {},
          categories: { code: true },
        },
      };

      const output = buildOutput(plugin, [], routing, {
        allModels: {
          "gpt-4": {
            displayName: "GPT-4",
            enabled: true,
            contextLength: 128000,
            maxCompletionTokens: 4096,
          },
        },
        modelProxyConfig: {
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
      const plugin = createOpenCodePlugin();
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "opencode.json",
        routing: {
          agents: {},
          categories: { code: true, docs: false, review: true },
        },
      };

      const output = buildOutput(plugin, [], routing, {
        allModels: {
          "gpt-4": {
            displayName: "GPT-4",
            enabled: true,
            contextLength: 128000,
            maxCompletionTokens: 4096,
          },
          "gpt-3.5": {
            displayName: "GPT-3.5",
            enabled: true,
            contextLength: 16000,
            maxCompletionTokens: 4096,
          },
        },
        modelProxyConfig: {
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
      const plugin = createOpenCodePlugin();
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "opencode.json",
        routing: { agents: {}, categories: {} },
      };

      const output = buildOutput(plugin, [], routing, {
        allModels: {
          "gpt-4": {
            displayName: "GPT-4",
            enabled: true,
            contextLength: 128000,
            maxCompletionTokens: 4096,
          },
        },
        modelProxyConfig: {
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
      const plugin = createOpenCodePlugin();
      const agents: SystemAgent[] = [
        makeSystemAgent({ id: "sisyphus", model: "gpt-4" }),
      ];
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "opencode.json",
        routing: { agents: { sisyphus: "sisyphus" }, categories: {} },
      };

      const output = buildOutput(plugin, agents, routing, {
        allModels: {
          "gpt-4": {
            displayName: "GPT-4",
            enabled: true,
            contextLength: 128000,
            maxCompletionTokens: 4096,
          },
        },
        modelProxyConfig: {
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
