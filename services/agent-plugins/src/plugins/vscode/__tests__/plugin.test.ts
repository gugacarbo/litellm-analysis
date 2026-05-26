import { describe, expect, it } from "vitest";
import type { PluginRouting, SystemAgent } from "../../../types";
import { createVsCodePlugin } from "../factory/plugin.factory";

function buildOutput(
  plugin: ReturnType<typeof createVsCodePlugin>,
  agents: SystemAgent[],
  routing: PluginRouting,
  context: Parameters<
    ReturnType<typeof createVsCodePlugin>["handlers"]["build"]
  >[0]["context"],
) {
  return plugin.handlers.build({
    agents,
    routing: routing as Parameters<
      ReturnType<typeof createVsCodePlugin>["handlers"]["build"]
    >[0]["routing"],
    context,
  });
}

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

describe("createVsCodePlugin", () => {
  describe("metadata", () => {
    it("tem id, name e version corretos", () => {
      const plugin = createVsCodePlugin();
      expect(plugin.manifest.id).toBe("vscode");
      expect(plugin.manifest.displayName).toBe("VS Code OAICopilot");
      expect(plugin.manifest.version).toBe(2);
    });
  });

  describe("getInternalAgents", () => {
    it("retorna undefined (sem agentes internos)", () => {
      const plugin = createVsCodePlugin();
      expect(plugin.manifest.internalAgents).toBeUndefined();
    });
  });

  describe("getConfigSchema (removed)", () => {
    it.skip("config validation now via Zod schemas", () => {
      // getConfigSchema was removed - config validation is now done via Zod schemas
    });
  });

  describe("getOutputFile", () => {
    it("retorna vscode-oaicopilot.json", () => {
      const plugin = createVsCodePlugin();
      expect(plugin.manifest.output.fileName).toBe("vscode-oaicopilot.json");
    });
  });

  describe("buildOutput", () => {
    it("gera estrutura com campos oaicopilot", () => {
      const plugin = createVsCodePlugin();
      const output = buildOutput(
        plugin,
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
      const plugin = createVsCodePlugin();
      const output = buildOutput(
        plugin,
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
      const plugin = createVsCodePlugin();
      const output = buildOutput(
        plugin,
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
      const plugin = createVsCodePlugin();
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "vscode-oaicopilot.json",
        config: {
          "oaicopilot.commitLanguage": "English",
          "oaicopilot.retry": {
            enabled: false,
            max_attempts: 5,
            interval_ms: 2000,
            status_codes: [],
          },
        },
        routing: { agents: {}, categories: {} },
      };

      const output = buildOutput(plugin, [], routing, {
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
      const plugin = createVsCodePlugin();
      const output = buildOutput(
        plugin,
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
      const plugin = createVsCodePlugin();
      const output = buildOutput(
        plugin,
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
      const plugin = createVsCodePlugin();
      const agents = [makeSystemAgent(), makeSystemAgent()];

      const output = buildOutput(
        plugin,
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
