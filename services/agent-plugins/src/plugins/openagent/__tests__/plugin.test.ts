import type {
  PluginRouting,
  SystemAgent,
} from "@lite-llm/agents-repository/schemas";
import { describe, expect, it } from "vitest";
import { OpenAgentPlugin } from "../plugin";

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

describe("OpenAgentPlugin", () => {
  describe("metadata", () => {
    it("tem id, name e version corretos", () => {
      const plugin = new OpenAgentPlugin();
      expect(plugin.id).toBe("openagent");
      expect(plugin.name).toBe("Oh My OpenAgent");
      expect(plugin.version).toBe(1);
    });
  });

  describe("getInternalAgents", () => {
    it("retorna 1 agente interno", () => {
      const plugin = new OpenAgentPlugin();
      expect(plugin.getInternalAgents()).toHaveLength(1);
    });

    it("agente interno é 'default'", () => {
      const plugin = new OpenAgentPlugin();
      const agents = plugin.getInternalAgents();
      expect(agents[0].id).toBe("default");
      expect(agents[0].displayName).toBe("Default");
    });
  });

  describe("getConfigSchema", () => {
    it("retorna schema com campos", () => {
      const plugin = new OpenAgentPlugin();
      const schema = plugin.getConfigSchema();
      expect(schema.length).toBeGreaterThan(0);
    });

    it("campos são booleanos com defaults", () => {
      const plugin = new OpenAgentPlugin();
      const schema = plugin.getConfigSchema();
      expect(schema).toHaveLength(2);
      expect(schema[0].key).toBe("commitFooter");
      expect(schema[0].type).toBe("boolean");
      expect(schema[1].key).toBe("includeCoAuthoredBy");
      expect(schema[1].type).toBe("boolean");
    });
  });

  describe("getOutputFile", () => {
    it("retorna oh-my-openagent.json", () => {
      const plugin = new OpenAgentPlugin();
      expect(plugin.getOutputFile()).toBe("oh-my-openagent.json");
    });
  });

  describe("buildOutput", () => {
    it("gera estrutura com $schema e git_master", () => {
      const plugin = new OpenAgentPlugin();
      const output = plugin.buildOutput(
        [],
        {
          enabled: true,
          outputFile: "oh-my-openagent.json",
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

      expect(output.$schema).toContain("oh-my-opencode");
      expect(output).toHaveProperty("git_master");
      expect(output).toHaveProperty("agents");
      expect(output).toHaveProperty("categories");
    });

    it("usa defaults para git_master quando sem config", () => {
      const plugin = new OpenAgentPlugin();
      const output = plugin.buildOutput(
        [],
        {
          enabled: true,
          outputFile: "oh-my-openagent.json",
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

      const gitMaster = output.git_master as Record<string, unknown>;
      expect(gitMaster.commit_footer).toBe(false);
      expect(gitMaster.include_co_authored_by).toBe(false);
    });

    it("aplica config do plugin para git_master", () => {
      const plugin = new OpenAgentPlugin();
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "oh-my-openagent.json",
        config: { commitFooter: true, includeCoAuthoredBy: true },
        routing: { agents: {}, categories: {} },
      };

      const output = plugin.buildOutput([], routing, {
        allModels: {},
        litellmConfig: {
          baseUrl: "http://localhost:4000",
          apiKey: "test-key",
        },
      }) as unknown as Record<string, unknown>;

      const gitMaster = output.git_master as Record<string, unknown>;
      expect(gitMaster.commit_footer).toBe(true);
      expect(gitMaster.include_co_authored_by).toBe(true);
    });

    it("inclui globalFallbackModel do contexto", () => {
      const plugin = new OpenAgentPlugin();
      const output = plugin.buildOutput(
        [],
        {
          enabled: true,
          outputFile: "oh-my-openagent.json",
          routing: { agents: {}, categories: {} },
        },
        {
          allModels: {},
          globalFallbackModel: "gpt-4",
          litellmConfig: {
            baseUrl: "http://localhost:4000",
            apiKey: "test-key",
          },
        },
      ) as unknown as Record<string, unknown>;

      expect(output.globalFallbackModel).toBe("gpt-4");
    });

    it("mapeia agentes com campos relevantes", () => {
      const plugin = new OpenAgentPlugin();
      const agents = [
        makeSystemAgent({
          description: "Build stuff",
          model: "gpt-4",
          config: {
            mode: "all",
            tools: { read: true, write: true },
            color: "blue",
          },
        }),
      ];
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "oh-my-openagent.json",
        routing: { agents: { Builder: "default" }, categories: {} },
      };

      const output = plugin.buildOutput(agents, routing, {
        allModels: {},
        litellmConfig: {
          baseUrl: "http://localhost:4000",
          apiKey: "test-key",
        },
      }) as unknown as Record<string, unknown>;

      const agentsMap = output.agents as Record<string, unknown>;
      expect(agentsMap).toHaveProperty("default");
      const entry = agentsMap.default as Record<string, unknown>;
      expect(entry.description).toBe("Build stuff");
      expect(entry.model).toBe("gpt-4");
      expect(entry).not.toHaveProperty("fallback_models");
    });

    it("ignora agentes sem mapeamento", () => {
      const plugin = new OpenAgentPlugin();
      const agents = [makeSystemAgent()];

      const output = plugin.buildOutput(
        agents,
        {
          enabled: true,
          outputFile: "oh-my-openagent.json",
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

      const agentsMap = output.agents as Record<string, unknown>;
      expect(Object.keys(agentsMap)).toHaveLength(0);
    });
  });
});
