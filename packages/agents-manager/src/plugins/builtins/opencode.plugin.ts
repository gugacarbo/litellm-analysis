import type {
  AgentVersion,
  ModelSpec,
  PluginRoutingConfig,
  SystemAgent,
} from "@lite-llm/agents-repository/schema";
import type { IPlugin, TransformContext } from "../plugin.js";
import type { ConfigField, InternalAgent } from "../plugin-types.js";

interface OpenCodeProviders {
  provider: Record<string, unknown>;
}

export class OpenCodePlugin implements IPlugin {
  readonly id = "opencode";
  readonly name = "OpenCode AI SDK";
  readonly version = 1;
  readonly outputFile = "opencode.json";

  getInternalAgents(): InternalAgent[] {
    return [
      {
        id: "coder",
        displayName: "Coder",
        description: "General-purpose coding agent",
      },
      {
        id: "planner",
        displayName: "Planner",
        description: "Planning and scoping agent",
      },
      {
        id: "explorer",
        displayName: "Explorer",
        description: "Codebase exploration agent",
      },
      {
        id: "reviewer",
        displayName: "Reviewer",
        description: "Code review agent",
      },
      {
        id: "writer",
        displayName: "Writer",
        description: "Documentation and writing agent",
      },
      {
        id: "architect",
        displayName: "Architect",
        description: "Architecture decisions agent",
      },
    ];
  }

  getConfigSchema(): ConfigField[] {
    return [
      {
        key: "defaultVersion",
        type: "select",
        label: "Default Version",
        required: false,
        default: "latest",
        options: [
          { value: "latest", label: "Latest" },
          { value: "stable", label: "Stable" },
        ],
        description: "Default version to use when no override is set",
      },
    ];
  }

  buildOutput(
    agents: SystemAgent[],
    routing: PluginRoutingConfig,
    ctx: TransformContext,
  ): OpenCodeProviders {
    const output: OpenCodeProviders = { provider: {} };

    const litellmModels: Record<string, unknown> = {};
    for (const [key, spec] of Object.entries(ctx.allModels)) {
      litellmModels[key] = {
        id: key,
        name: (spec as ModelSpec).displayName,
        limit: {
          context: (spec as ModelSpec).contextLength,
          output: (spec as ModelSpec).maxOutput,
        },
      };
    }

    output.provider.litellm = {
      name: "LiteLLM",
      npm: "@ai-sdk/openai-compatible",
      options: {
        baseURL: ctx.litellmConfig.baseUrl,
        apiKey: ctx.litellmConfig.apiKey,
      },
      models: litellmModels,
    };

    const pluginRouting = routing.plugins[this.id];
    const agentMappings = (pluginRouting?.agentMappings ?? {}) as Record<
      string,
      string
    >;

    for (const agent of agents) {
      if (!agent.id) continue;

      const internalAgentId = agentMappings[agent.id];
      if (!internalAgentId) continue;

      const models: Record<string, unknown> = {};
      for (const version of agent.versions) {
        const resolvedVersion =
          (pluginRouting?.agents[agent.id]?.versionOverrides?.[
            version.id
          ] as AgentVersion) ?? version;
        models[version.id] = {
          id: `${internalAgentId}/${version.id}`,
          name: `${resolvedVersion.displayName} ${version.displayName}`,
          limit: {
            context: version.limits.context,
            output: version.limits.output,
          },
        };
      }

      output.provider[internalAgentId] = {
        npm: "@ai-sdk/openai-compatible",
        options: {
          baseURL: ctx.litellmConfig.baseUrl,
          apiKey: ctx.litellmConfig.apiKey,
        },
        models,
      };
    }

    return output;
  }

  getOutputFile(): string {
    return this.outputFile;
  }
}
