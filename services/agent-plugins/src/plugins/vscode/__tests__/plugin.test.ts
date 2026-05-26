import type {
  PluginRouting,
  SystemAgent,
} from "../../../types";
import { describe, expect, it } from "vitest";
import { VsCodePlugin } from "../plugin";

function makeSystemAgent(overrides: Partial<SystemAgent> = {}): SystemAgent {
  return {
    displayName: "Builder",
    icon: "🔧",
    description: "Build stuff",
    limits: { context: 200000, output: 32768 },
    model: "gpt-4",
    config: {},
    ...overrides,
  };
}

describe("VsCodePlugin", () => {
  describe("metadata", () => {
    it("tem id, name e version corretos", () => {
      const plugin = new VsCodePlugin();
      expect(plugin.id).toBe("vscode");
      expect(plugin.name).toBe("VS Code OAICopilot");
      expect(plugin.version).toBe(1);
    });
  });

  describe("getInternalAgents", () => {
    it("retorna array vazio", () => {
      const plugin = new VsCodePlugin();
      expect(plugin.getInternalAgents()).toEqual([]);
    });
  });

  describe("getConfigSchema", () => {
    it("retorna schema com 3 campos", () => {
      const plugin = new VsCodePlugin();
      const schema = plugin.getConfigSchema();
      expect(schema).toHaveLength(3);
    });

    it("campos têm keys e tipos corretos", () => {
      const plugin = new VsCodePlugin();
      const schema = plugin.getConfigSchema();
      expect(schema[0].key).toBe("commitLanguage");
      expect(schema[0].type).toBe("string");
      expect(schema[1].key).toBe("retryEnabled");
      expect(schema[1].type).toBe("boolean");
      expect(schema[2].key).toBe("maxRetryAttempts");
      expect(schema[2].type).toBe("number");
    });
  });

  describe("getOutputFile", () => {
    it("retorna vscode-oaicopilot.json", () => {
      const plugin = new VsCodePlugin();
      expect(plugin.getOutputFile()).toBe("vscode-oaicopilot.json");
    });
  });

  describe("buildOutput", () => {
    it("gera estrutura com campos oaicopilot", () => {
      const plugin = new VsCodePlugin();
      const output = plugin.buildOutput(
        [],
        {
          enabled: true,
          outputFile: "vscode-oaicopilot.json",
          routing: { agents: {}, categories: {} },
        },
        {
          allModels: {},
          litellmConfig: {
            baseUrl: "http://localhost:4000/v1",
            apiKey: "test-key",
          },
        },
      ) as unknown as Record<string, unknown>;

      expect(output).toHaveProperty("oaicopilot.commitLanguage");
      expect(output).toHaveProperty("oaicopilot.baseUrl");
      expect(output).toHaveProperty("oaicopilot.delay");
      expect(output).toHaveProperty("oaicopilot.readFileLines");
      expect(output).toHaveProperty("oaicopilot.retry");
      expect(output).toHaveProperty("oaicopilot.models");
    });

    it("remove /v1 do baseUrl", () => {
      const plugin = new VsCodePlugin();
      const output = plugin.buildOutput(
        [],
        {
          enabled: true,
          outputFile: "vscode-oaicopilot.json",
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
      ) as unknown as Record<string, unknown>;

      const models = output["oaicopilot.models"] as Array<
        Record<string, unknown>
      >;
      expect(models).toHaveLength(1);
      expect(models[0].baseUrl).toBe("http://localhost:4000");
    });

    it("usa defaults quando sem config do plugin", () => {
      const plugin = new VsCodePlugin();
      const output = plugin.buildOutput(
        [],
        {
          enabled: true,
          outputFile: "vscode-oaicopilot.json",
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

      expect(output["oaicopilot.commitLanguage"]).toBe("Portuguese (Brazil)");
      const retry = output["oaicopilot.retry"] as Record<string, unknown>;
      expect(retry.enabled).toBe(true);
      expect(retry.max_attempts).toBe(3);
      expect(retry.interval_ms).toBe(2000);
    });

    it("aplica config do plugin", () => {
      const plugin = new VsCodePlugin();
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "vscode-oaicopilot.json",
        config: {
          commitLanguage: "English",
          retryEnabled: false,
          maxRetryAttempts: 5,
        },
        routing: { agents: {}, categories: {} },
      };

      const output = plugin.buildOutput([], routing, {
        allModels: {},
        litellmConfig: {
          baseUrl: "http://localhost:4000",
          apiKey: "test-key",
        },
      }) as unknown as Record<string, unknown>;

      expect(output["oaicopilot.commitLanguage"]).toBe("English");
      const retry = output["oaicopilot.retry"] as Record<string, unknown>;
      expect(retry.enabled).toBe(false);
      expect(retry.max_attempts).toBe(5);
    });

    it("inclui modelos com displayName, id e max-tokens", () => {
      const plugin = new VsCodePlugin();
      const output = plugin.buildOutput(
        [],
        {
          enabled: true,
          outputFile: "vscode-oaicopilot.json",
          routing: { agents: {}, categories: {} },
        },
        {
          allModels: {
            "gpt-4": {
              displayName: "GPT-4",
              enabled: true,
              limits: { length: 128000, maxOutput: 4096 },
            },
            "claude-3.5": {
              displayName: "Claude 3.5 Sonnet",
              enabled: true,
              limits: { length: 200000, maxOutput: 8192 },
            },
          },
          litellmConfig: {
            baseUrl: "http://localhost:4000",
            apiKey: "test-key",
          },
        },
      ) as unknown as Record<string, unknown>;

      const models = output["oaicopilot.models"] as Array<
        Record<string, unknown>
      >;
      expect(models).toHaveLength(2);

      const gpt4 = models.find((m) => m.id === "gpt-4");
      expect(gpt4?.name).toBe("GPT-4");
      const gpt4Settings = gpt4?.["model-settings"] as Record<string, unknown>;
      expect(gpt4Settings["max-tokens"]).toBe(4096);

      const claude = models.find((m) => m.id === "claude-3.5");
      expect(claude?.name).toBe("Claude 3.5 Sonnet");
    });

    it("configura Authorization header com placeholder", () => {
      const plugin = new VsCodePlugin();
      const output = plugin.buildOutput(
        [],
        {
          enabled: true,
          outputFile: "vscode-oaicopilot.json",
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

      const models = output["oaicopilot.models"] as Array<
        Record<string, unknown>
      >;
      const requestOptions = models[0]["request-options"] as Record<
        string,
        unknown
      >;
      const headers = requestOptions.headers as Record<string, unknown>;
      expect(headers.Authorization).toBe("Bearer {env:LITELLM_API_KEY}");
    });

    it("ignora lista de agentes (usa apenas allModels)", () => {
      const plugin = new VsCodePlugin();
      const agents = [makeSystemAgent(), makeSystemAgent()];

      const output = plugin.buildOutput(
        agents,
        {
          enabled: true,
          outputFile: "vscode-oaicopilot.json",
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

      const models = output["oaicopilot.models"] as Array<
        Record<string, unknown>
      >;
      expect(models).toHaveLength(1);
    });
  });
});
