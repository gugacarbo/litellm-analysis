import type {
  OpenCodePluginConfig,
  SystemAgent,
} from "@lite-llm/agents-repository/schemas";
import type { ModelSpec } from "@lite-llm/models-repository/schemas";
import { DEFAULT_MODEL_NAMES } from "@lite-llm/models-service";
import type { IPlugin, TransformContext, TypedPluginRouting } from "../plugin";
import type {
  ConfigField,
  InternalAgent,
  PluginConfigFor,
} from "../plugin-types";
import { openCodeSchema } from "./schemas/generated/opencode.zod";

interface OpenCodeProviders {
  $schema: string;
  provider: Record<string, unknown>;
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

function buildModelEntry(
  agentRole: string,
  aliasKey: string,
  displayName: string,
  spec: ModelSpec,
): Record<string, unknown> {
  const entry: Record<string, unknown> = {
    id: `${agentRole}/${aliasKey}`,
    name: displayName,
    limit: {
      context: spec.limits.length,
      output: spec.limits.maxOutput,
    },
  };

  if (spec.cost?.input != null || spec.cost?.output != null) {
    entry.cost = {
      ...(spec.cost?.input != null ? { input: spec.cost.input } : {}),
      ...(spec.cost?.output != null ? { output: spec.cost.output } : {}),
    };
  }

  const thinkingVariants = buildThinkingVariants(spec);
  if (thinkingVariants) {
    entry.variants = thinkingVariants;
  }

  return entry;
}

export class OpenCodePlugin implements IPlugin<"opencode"> {
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
    routing: TypedPluginRouting<PluginConfigFor<"opencode">>,
    ctx: TransformContext,
  ): OpenCodeProviders {
    const config: OpenCodePluginConfig = (routing.config ??
      {}) as OpenCodePluginConfig;
    const configDefaultModel = config.defaultModel || "";
    const configDefaultTemp = config.defaultTemperature ?? 0.2;
    const schemaUrl =
      config.$schema ??
      "https://raw.githubusercontent.com/opensoft/lite-llm-analytics/main/services/agent-plugins/src/plugins/opencode/schemas/opencode.schema.json";

    // Model slot names from plugin context
    const modelNames = ctx.modelNames ?? DEFAULT_MODEL_NAMES;

    const output: OpenCodeProviders = {
      $schema: schemaUrl,
      provider: {},
    };

    const providerOpts = {
      npm: "@ai-sdk/openai-compatible",
      options: {
        baseURL: ctx.litellmConfig.baseUrl,
        apiKey: ctx.litellmConfig.apiKey,
      },
    };

    // ── LiteLLM provider (all models from ctx.allModels) ──
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
      ...providerOpts,
      models: litellmModels,
    };

    const enabledAgents = routing.routing?.agents ?? {};

    // ── Per-agent providers ──
    for (const agent of agents) {
      const agentRole = Object.entries(enabledAgents).find(
        ([, agentId]) => agentId === agent.id,
      )?.[0];
      if (!agentRole) continue;

      const primaryModelId: string =
        agent.model || configDefaultModel || agent.id || "";
      const primarySpec = primaryModelId
        ? ctx.allModels[primaryModelId]
        : undefined;

      const agentModels: Record<string, unknown> = {};

      // Primary model → gpt-5.5
      if (primarySpec) {
        agentModels[modelNames[0]] = buildModelEntry(
          agentRole,
          modelNames[0],
          agent.displayName || primarySpec.displayName,
          primarySpec,
        );
      }

      // Fallback models → gpt-5.4, gpt-5.3, gpt-5.2
      const fallbacks = agent.fallbackModels ?? [];
      for (
        let fbIdx = 0;
        fbIdx < Math.min(fallbacks.length, modelNames.length - 2);
        fbIdx++
      ) {
        const fbModelId = fallbacks[fbIdx];
        if (!fbModelId) continue;
        const fbSpec = ctx.allModels[fbModelId];
        if (!fbSpec) continue;
        const aliasKey = modelNames[fbIdx + 1];
        agentModels[aliasKey] = buildModelEntry(
          agentRole,
          aliasKey,
          `${agent.displayName || fbSpec.displayName} Fb`,
          fbSpec,
        );
      }

      if (Object.keys(agentModels).length > 0) {
        output.provider[agentRole] = {
          ...providerOpts,
          models: agentModels,
        };
      }
    }

    // ── Global fallback provider ──
    const globalFallbackId = ctx.globalFallbackModel;
    if (globalFallbackId) {
      const globalSpec = ctx.allModels[globalFallbackId];
      if (globalSpec) {
        const globalModels: Record<string, unknown> = {};
        globalModels[modelNames[0]] = buildModelEntry(
          "global-fallback",
          modelNames[0],
          "Global Fallback",
          globalSpec,
        );
        output.provider["global-fallback"] = {
          ...providerOpts,
          models: globalModels,
        };
      }
    }

    // ── Categories section ──
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

  validate(output: unknown): boolean {
    const result = openCodeSchema.safeParse(output);
    if (!result.success) {
      console.error("[OpenCodePlugin] Validation failed:", result.error.issues);
    }
    return result.success;
  }
}
