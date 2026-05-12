import type {
  PluginRouting,
  SystemAgent,
} from "@lite-llm/agents-repository/schemas";
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
    return [];
  }

  buildOutput(
    agents: SystemAgent[],
    routing: PluginRouting,
    ctx: TransformContext,
  ): OpenCodeProviders {
    const output: OpenCodeProviders = { provider: {} };

    const litellmModels: Record<string, unknown> = {};
    for (const [key, spec] of Object.entries(ctx.allModels)) {
      litellmModels[key] = {
        id: key,
        name: spec.displayName,
        limit: {
          context: spec.limits.length,
          output: spec.limits.maxOutput,
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

    const agentMappings = routing.routing?.agents ?? {};

    for (const agent of agents) {
      const agentId = agent.displayName;
      const internalAgentId = agentMappings[agentId];
      if (!internalAgentId) continue;

      const limits = agent.limits;
      const modelKey = "default";
      const modelLabel = "Default";

      output.provider[internalAgentId] = {
        npm: "@ai-sdk/openai-compatible",
        options: {
          baseURL: ctx.litellmConfig.baseUrl,
          apiKey: ctx.litellmConfig.apiKey,
        },
        models: {
          [modelKey]: {
            id: `${internalAgentId}/${modelKey}`,
            name: `${agent.displayName} ${modelLabel}`,
            limit: {
              context: limits.context,
              output: limits.output,
            },
          },
        },
      };
    }

    return output;
  }

  getOutputFile(): string {
    return this.outputFile;
  }
}
