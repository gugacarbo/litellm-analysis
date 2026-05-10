import type {
  PluginRoutingConfig,
  SystemAgent,
} from "@lite-llm/agents-repository/schema";
import type { IPlugin, TransformContext } from "../plugin.js";
import type { ConfigField, InternalAgent } from "../plugin-types.js";

interface OpenAgentOutput {
  $schema: string;
  globalFallbackModel?: string;
  git_master: {
    commit_footer: boolean;
    include_co_authored_by: boolean;
  };
  agents: Record<string, Record<string, unknown>>;
  categories: Record<string, Record<string, unknown>>;
}

export class OpenAgentPlugin implements IPlugin {
  readonly id = "openagent";
  readonly name = "Oh My OpenAgent";
  readonly version = 1;
  readonly outputFile = "oh-my-openagent.json";

  getInternalAgents(): InternalAgent[] {
    return [
      { id: "default", displayName: "Default", description: "Default OpenAgent" },
    ];
  }

  getConfigSchema(): ConfigField[] {
    return [
      {
        key: "commitFooter",
        type: "boolean",
        label: "Commit Footer",
        required: false,
        default: false,
        description: "Add footer to commit messages",
      },
      {
        key: "includeCoAuthoredBy",
        type: "boolean",
        label: "Include Co-Authored-By",
        required: false,
        default: false,
        description: "Include co-authored-by trailer in commits",
      },
    ];
  }

  buildOutput(
    agents: SystemAgent[],
    routing: PluginRoutingConfig,
    ctx: TransformContext,
  ): OpenAgentOutput {
    const pluginRouting = routing.plugins[this.id];
    const config = (pluginRouting?.config ?? {}) as Record<string, unknown>;

    const output: OpenAgentOutput = {
      $schema:
        "https://raw.githubusercontent.com/opensoft/oh-my-opencode/dev/assets/oh-my-opencode.schema.json",
      globalFallbackModel: ctx.globalFallbackModel,
      git_master: {
        commit_footer: (config.commitFooter as boolean) ?? false,
        include_co_authored_by: (config.includeCoAuthoredBy as boolean) ?? false,
      },
      agents: {},
      categories: {},
    };

    const agentMappings = (
      pluginRouting?.agentMappings ?? {}
    ) as Record<string, string>;
    for (const agent of agents) {
      if (!agent.id) continue;
      const internalId = agentMappings[agent.id];
      if (!internalId) continue;

      const entry: Record<string, unknown> = {};
      if (agent.description) entry.description = agent.description;
      if (agent.model) entry.model = agent.model;
      if (agent.fallbackModels?.length) {
        entry.fallback_models = agent.fallbackModels;
      }
      if (agent.config?.mode) entry.mode = agent.config.mode;
      if (agent.config?.tools) entry.tools = agent.config.tools;
      if (agent.config?.color) entry.color = agent.config.color;

      output.agents[internalId] = entry;
    }

    return output;
  }

  getOutputFile(): string {
    return this.outputFile;
  }
}
