import type {
  PluginRouting,
  SystemAgent,
} from "@lite-llm/agents-repository/schemas";
import type { ModelSpec } from "@lite-llm/models-repository/schemas";
import type { IPlugin, TransformContext } from "../plugin";
import type { ConfigField, InternalAgent } from "../plugin-types";

interface OpenCodeProviders {
  provider: Record<string, unknown>;
  agent?: Record<string, unknown>;
  category?: Record<string, unknown>;
}

const OPENCODE_REASONING_EFFORT_LEVELS = new Set([
  "none",
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
]);

function normalizeThinkingLevel(level: string): string | null {
  const normalized = level
    .trim()
    .toLowerCase()
    .replace(/[\s_-]/g, "");
  if (!normalized) return null;

  if (normalized === "off" || normalized === "disabled") {
    return "none";
  }

  if (OPENCODE_REASONING_EFFORT_LEVELS.has(normalized)) {
    return normalized;
  }

  return null;
}

function buildThinkingVariants(
  model: ModelSpec,
): Record<string, { reasoningEffort: string }> | undefined {
  const levels = model.thinking?.levels ?? [];
  if (levels.length === 0) return undefined;

  const variants: Record<string, { reasoningEffort: string }> = {};
  for (const level of levels) {
    const normalizedLevel = normalizeThinkingLevel(level);
    if (!normalizedLevel) continue;

    variants[normalizedLevel] = {
      reasoningEffort: normalizedLevel,
    };
  }

  if (Object.keys(variants).length === 0) {
    return undefined;
  }

  return variants;
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
      const modelOutput: Record<string, unknown> = {
        id: key,
        name: spec.displayName,
        limit: {
          context: spec.limits.length,
          output: spec.limits.maxOutput,
        },
      };

      if (spec.cost?.input != null || spec.cost?.output != null) {
        modelOutput.cost = {
          ...(spec.cost?.input != null ? { input: spec.cost.input } : {}),
          ...(spec.cost?.output != null ? { output: spec.cost.output } : {}),
        };
      }

      const thinkingVariants = buildThinkingVariants(spec);
      if (thinkingVariants) {
        modelOutput.variants = thinkingVariants;
      }

      litellmModels[key] = modelOutput;
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

    // Build agents section from routing configuration
    if (routing.routing?.agents) {
      output.agent = {};
      for (const [agentName] of Object.entries(routing.routing.agents)) {
        output.agent[agentName] = {
          model: "litellm/MiniMax-M2.7-highspeed",
          fallback_models: [],
          temperature: 0.2,
        };
      }
    }

    // Build categories section from categories configuration
    if (ctx.allCategories && Object.keys(ctx.allCategories).length > 0) {
      output.category = {};
      for (const [categoryName, category] of Object.entries(
        ctx.allCategories,
      )) {
        output.category[categoryName] = {
          description: category.description ?? "",
          model: category.model ?? "litellm/MiniMax-M2.7-highspeed",
          fallback_models: category.fallbackModels ?? [],
          temperature: category.temperature ?? 0.2,
        };
      }
    }

    return output;
  }

  getOutputFile(): string {
    return this.outputFile;
  }
}
