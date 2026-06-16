import { describe, expect, it } from "vitest";
import type { PluginRouting, SystemAgent } from "../../../types";
import { createOpenAgentPlugin } from "../factory/plugin.factory";

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

describe("createOpenAgentPlugin", () => {
  describe("metadata", () => {
    it("tem id e name corretos no manifest", () => {
      const plugin = createOpenAgentPlugin();
      expect(plugin.manifest.id).toBe("openagent");
      expect(plugin.manifest.displayName).toBe("Oh My OpenAgent");
    });
  });

  describe("getInternalAgents", () => {
    it("retorna 1 agente interno", () => {
      const plugin = createOpenAgentPlugin();
      expect(plugin.manifest.internalAgents).toHaveLength(1);
    });

    it("agente interno é 'default'", () => {
      const plugin = createOpenAgentPlugin();
      const agents = plugin.manifest.internalAgents;
      expect(agents).toBeDefined();
      if (!agents) return;
      expect(agents[0].id).toBe("default");
      expect(agents[0].displayName).toBe("Default");
    });
  });

  describe("getConfigSchema (removed)", () => {
    it.skip("retorna schema com campos", () => {
      // getConfigSchema was removed - config validation is now done via Zod schemas
    });
  });

  describe("output metadata", () => {
    it("retorna oh-my-openagent.json", () => {
      const plugin = createOpenAgentPlugin();
      expect(plugin.manifest.output.fileName).toBe("oh-my-openagent.json");
    });
  });

  describe("build", () => {
    it("gera estrutura com $schema e git_master", () => {
      const plugin = createOpenAgentPlugin();
      const output = plugin.handlers.build({
        agents: [],
        routing: {
          enabled: true,
          outputFile: "oh-my-openagent.json",
          routing: { agents: {}, categories: {} },
        },
        context: {
          allModels: {},
          modelProxyConfig: {
            baseUrl: "http://localhost:4000",
            apiKey: "test-key",
          },
        },
      }) as unknown as Record<string, unknown>;

      expect(output.$schema).toContain("oh-my-opencode");
      expect(output).toHaveProperty("git_master");
      expect(output).toHaveProperty("agents");
      expect(output).toHaveProperty("categories");
    });

    it("usa defaults para git_master quando sem config", () => {
      const plugin = createOpenAgentPlugin();
      const output = plugin.handlers.build({
        agents: [],
        routing: {
          enabled: true,
          outputFile: "oh-my-openagent.json",
          routing: { agents: {}, categories: {} },
        },
        context: {
          allModels: {},
          modelProxyConfig: {
            baseUrl: "http://localhost:4000",
            apiKey: "test-key",
          },
        },
      }) as unknown as Record<string, unknown>;

      const gitMaster = output.git_master as Record<string, unknown>;
      expect(gitMaster.commit_footer).toBe(false);
      expect(gitMaster.include_co_authored_by).toBe(false);
    });

    it("aplica config do plugin para git_master", () => {
      const plugin = createOpenAgentPlugin();
      const routing: PluginRouting = {
        enabled: true,
        outputFile: "oh-my-openagent.json",
        config: {
          git_master: {
            commit_footer: true,
            include_co_authored_by: true,
          },
        },
        routing: { agents: {}, categories: {} },
      };

      const output = plugin.handlers.build({
        agents: [],
        routing,
        context: {
          allModels: {},
          modelProxyConfig: {
            baseUrl: "http://localhost:4000",
            apiKey: "test-key",
          },
        },
      }) as unknown as Record<string, unknown>;

      const gitMaster = output.git_master as Record<string, unknown>;
      expect(gitMaster.commit_footer).toBe(true);
      expect(gitMaster.include_co_authored_by).toBe(true);
    });

    it("remove globalFallbackModel fora do schema final", () => {
      const plugin = createOpenAgentPlugin();
      const output = plugin.handlers.build({
        agents: [],
        routing: {
          enabled: true,
          outputFile: "oh-my-openagent.json",
          routing: { agents: {}, categories: {} },
        },
        context: {
          allModels: {},
          globalFallbackModel: "gpt-4",
          modelProxyConfig: {
            baseUrl: "http://localhost:4000",
            apiKey: "test-key",
          },
        },
      }) as unknown as Record<string, unknown>;

      expect(output.globalFallbackModel).toBeUndefined();
    });

    it("mapeia agentes com campos relevantes", () => {
      const plugin = createOpenAgentPlugin();
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
        routing: { agents: { Builder: "build" }, categories: {} },
      };

      const output = plugin.handlers.build({
        agents,
        routing,
        context: {
          allModels: {},
          modelProxyConfig: {
            baseUrl: "http://localhost:4000",
            apiKey: "test-key",
          },
        },
      }) as unknown as Record<string, unknown>;

      const agentsMap = output.agents as Record<string, unknown>;
      expect(agentsMap).toHaveProperty("build");
      const entry = agentsMap.build as Record<string, unknown>;
      expect(entry.description).toBe("Build stuff");
      expect(entry.model).toBe("gpt-4");
      expect(entry).not.toHaveProperty("fallback_models");
    });

    it("ignora agentes sem mapeamento", () => {
      const plugin = createOpenAgentPlugin();
      const agents = [makeSystemAgent()];

      const output = plugin.handlers.build({
        agents,
        routing: {
          enabled: true,
          outputFile: "oh-my-openagent.json",
          routing: { agents: {}, categories: {} },
        },
        context: {
          allModels: {},
          modelProxyConfig: {
            baseUrl: "http://localhost:4000",
            apiKey: "test-key",
          },
        },
      }) as unknown as Record<string, unknown>;

      const agentsMap = output.agents as Record<string, unknown>;
      expect(Object.keys(agentsMap)).toHaveLength(0);
    });
  });
});
