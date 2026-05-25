import type {
  OpenCodePluginConfig,
  SystemAgent,
} from "@lite-llm/agents-repository/schemas";
import {
  OPENCODE_DEFAULT_MODEL_DEFAULT,
  OPENCODE_DEFAULT_TEMPERATURE_DEFAULT,
} from "@lite-llm/agents-repository/schemas";
import type { ModelSpec } from "@lite-llm/models-repository/schemas";
import { resolveSlotModelId } from "../litellm-alias/generate";
import { DEFAULT_MODEL_NAMES } from "../litellm-alias/plugin";
import type { IPlugin, TransformContext, TypedPluginRouting } from "../plugin";
import { normalizeAgentMappings } from "../plugin";
import type {
  ConfigField,
  InternalAgent,
  PluginConfigFor,
} from "../plugin-types";
import { openCodeSchema } from "./schemas/generated/opencode.zod";

interface OpenCodeProviders {
  $schema: string;
  provider: Record<string, unknown>;
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

function addRoleModelSlots(
  target: Record<string, unknown>,
  role: string,
  displayName: string,
  primaryModelId: string,
  modelNames: readonly string[],
  ctx: TransformContext,
): void {
  for (let i = 0; i < modelNames.length; i++) {
    const modelId = resolveSlotModelId(
      i,
      modelNames.length,
      primaryModelId,
      ctx.globalFallbackModel,
    );
    if (!modelId) continue;

    const spec = ctx.allModels[modelId];
    if (!spec) continue;

    const slotDisplayName = i === 0 ? displayName : `${displayName} ${i}`;

    target[`${role}/${modelNames[i]}`] = buildModelEntry(
      role,
      modelNames[i],
      slotDisplayName,
      spec,
    );
  }
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
        default: OPENCODE_DEFAULT_MODEL_DEFAULT,
        placeholder: "e.g. gpt-4",
        description: "Model to use when a system agent has no model configured",
      },
      {
        key: "defaultTemperature",
        type: "number",
        label: "Default Temperature",
        required: false,
        default: OPENCODE_DEFAULT_TEMPERATURE_DEFAULT,
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

    const rawEnabledAgents: Record<string, string | string[]> =
      (routing.routing?.agents as Record<string, string | string[]>) ?? {};
    const enabledAgents = normalizeAgentMappings(rawEnabledAgents);

    // ── llm-agents provider ──
    const llmAgentsModels: Record<string, unknown> = {};

    for (const agent of agents) {
      const agentRole = Object.entries(enabledAgents).find(([, agentIds]) =>
        agentIds.includes(agent.id ?? ""),
      )?.[0];
      if (!agentRole) continue;

      const primaryModelId: string =
        agent.model || configDefaultModel || agent.id || "";
      const displayName =
        agent.displayName ||
        (primaryModelId ? ctx.allModels[primaryModelId]?.displayName : "") ||
        agentRole;

      addRoleModelSlots(
        llmAgentsModels,
        agentRole,
        displayName,
        primaryModelId,
        modelNames,
        ctx,
      );
    }

    if (Object.keys(llmAgentsModels).length > 0) {
      output.provider["llm-agents"] = {
        ...providerOpts,
        models: llmAgentsModels,
      };
    }

    // ── llm-categories provider ──
    const categoryRouting = routing.routing?.categories ?? {};
    const hasExplicitCategoryRouting = Object.keys(categoryRouting).length > 0;
    if (ctx.allCategories && Object.keys(ctx.allCategories).length > 0) {
      const llmCategoriesModels: Record<string, unknown> = {};

      for (const [categoryName, category] of Object.entries(
        ctx.allCategories,
      )) {
        if (hasExplicitCategoryRouting && !categoryRouting[categoryName])
          continue;

        const primaryModelId =
          category.model || configDefaultModel || categoryName;

        addRoleModelSlots(
          llmCategoriesModels,
          categoryName,
          categoryName,
          primaryModelId,
          modelNames,
          ctx,
        );
      }

      if (Object.keys(llmCategoriesModels).length > 0) {
        output.provider["llm-categories"] = {
          ...providerOpts,
          models: llmCategoriesModels,
        };
      }
    }

    // ── Global fallback provider (single primary slot only) ──
    const globalFallbackId = ctx.globalFallbackModel;
    if (globalFallbackId) {
      const globalSpec = ctx.allModels[globalFallbackId];
      if (globalSpec) {
        const primarySlot = modelNames[0];
        const globalFallbackEntry = buildModelEntry(
          "global-fallback",
          primarySlot,
          "Global Fallback",
          globalSpec,
        );
        const globalFallbackEntryId = String(globalFallbackEntry.id);

        output.provider["global-fallback"] = {
          ...providerOpts,
          models: {
            [globalFallbackEntryId]: globalFallbackEntry,
          },
        };
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
