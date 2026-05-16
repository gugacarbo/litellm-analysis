import type {
  PluginRouting,
  SystemAgent,
} from "@lite-llm/agents-repository/schemas";
import type { ModelSpec } from "@lite-llm/models-repository/schemas";
import type { IPlugin, TransformContext } from "../plugin";
import type { ConfigField, InternalAgent } from "../plugin-types";

interface OpenCodeProviders {
  provider: Record<string, unknown>;
  agents?: Record<string, unknown>;
  categories?: Record<string, unknown>;
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
    return [];
  }

  getConfigSchema(): ConfigField[] {
    return [
      {
        key: "defaultModel",
        type: "string",
        label: "Default Model",
        required: false,
        default: "",
        placeholder: "e.g. gpt-4",
        description: "Model to use when a system agent has no model configured",
      },
      {
        key: "defaultTemperature",
        type: "number",
        label: "Default Temperature",
        required: false,
        default: 0.2,
        description:
          "Default sampling temperature for agents without one configured",
      },
    ];
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

    const enabledAgents = routing.routing?.agents ?? {};
    const config = routing.config ?? {};
    const configDefaultModel = (config.defaultModel as string) || "";
    const configDefaultTemp = (config.defaultTemperature as number) ?? 0.2;

    // Build agents section from routing configuration
    if (Object.keys(enabledAgents).length > 0) {
      output.agents = {};
      for (const agent of agents) {
        const agentId = agent.displayName;
        if (!(agentId in enabledAgents)) continue;

        const model = agent.model
          ? `litellm/${agent.model}`
          : configDefaultModel
            ? `litellm/${configDefaultModel}`
            : `litellm/${agentId}`;

        output.agents[agentId] = {
          description: agent.description,
          model,
          fallback_models: agent.fallbackModels ?? [],
          temperature: agent.config?.temperature ?? configDefaultTemp,
        };
      }
    }

    // Build categories section from categories configuration
    const categoryRouting = routing.routing?.categories ?? {};
    if (ctx.allCategories && Object.keys(ctx.allCategories).length > 0) {
      const enabledCategories: Record<string, unknown> = {};
      for (const [categoryName, category] of Object.entries(
        ctx.allCategories,
      )) {
        if (!categoryRouting[categoryName]) continue;

        enabledCategories[categoryName] = {
          description: category.description ?? "",
          model:
            category.model ||
            (configDefaultModel
              ? `litellm/${configDefaultModel}`
              : "litellm/default"),
          fallback_models: category.fallbackModels ?? [],
          temperature: category.temperature ?? configDefaultTemp,
        };
      }
      if (Object.keys(enabledCategories).length > 0) {
        output.categories = enabledCategories;
      }
    }

    return output;
  }

  getOutputFile(): string {
    return this.outputFile;
  }
}
