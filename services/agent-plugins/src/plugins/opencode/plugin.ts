import type { ModelSpec } from "@lite-llm/models-repository/schemas";
import { normalizeAgentMappings } from "../../helpers";
import type { PluginDefinition } from "../../sdk";
import type { PluginRouting, SystemAgent } from "../../types";
import { resolveSlotModelId } from "../litellm-alias/generate";
import { DEFAULT_MODEL_NAMES } from "../litellm-alias/plugin";
import {
  type OpenCodePluginConfig,
  openCodePluginConfigSchema,
} from "./plugin.config";
import { type OpenCodeProviders, openCodeManifest } from "./plugin.manifest";
import { opencodeSchema } from "./plugin.schema";

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
  input: Parameters<
    PluginDefinition<
      "opencode",
      OpenCodePluginConfig,
      OpenCodeProviders
    >["handlers"]["build"]
  >[0],
): void {
  for (let i = 0; i < modelNames.length; i++) {
    const modelId = resolveSlotModelId(
      i,
      modelNames.length,
      primaryModelId,
      input.context.globalFallbackModel,
    );
    if (!modelId) continue;

    const spec = input.context.allModels[modelId];
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

export function createOpenCodePlugin(): PluginDefinition<
  "opencode",
  OpenCodePluginConfig,
  OpenCodeProviders
> {
  return {
    manifest: openCodeManifest,
    handlers: {
      build(input): OpenCodeProviders {
        const config = openCodePluginConfigSchema.parse(
          input.routing.config ?? {},
        );
        const configDefaultModel = config.defaultModel || "";
        const schemaUrl = config.$schema;

        const modelNames = input.context.modelNames ?? DEFAULT_MODEL_NAMES;

        const output: OpenCodeProviders = {
          $schema: schemaUrl,
          provider: {},
        };

        const providerOpts = {
          npm: "@ai-sdk/openai-compatible",
          options: {
            baseURL: input.context.litellmConfig.baseUrl,
            apiKey: input.context.litellmConfig.apiKey,
          },
        };

        const litellmModels: Record<string, unknown> = {};
        for (const [key, spec] of Object.entries(input.context.allModels)) {
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
              ...(spec.cost?.output != null
                ? { output: spec.cost.output }
                : {}),
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
          (input.routing.routing?.agents as Record<
            string,
            string | string[]
          >) ?? {};
        const enabledAgents = normalizeAgentMappings(rawEnabledAgents);

        const llmAgentsModels: Record<string, unknown> = {};

        for (const agent of input.agents) {
          const agentRole = Object.entries(enabledAgents).find(([, agentIds]) =>
            agentIds.includes(agent.id ?? ""),
          )?.[0];
          if (!agentRole) continue;

          const primaryModelId: string =
            agent.model || configDefaultModel || agent.id || "";
          const displayName =
            agent.displayName ||
            (primaryModelId
              ? input.context.allModels[primaryModelId]?.displayName
              : "") ||
            agentRole;

          addRoleModelSlots(
            llmAgentsModels,
            agentRole,
            displayName,
            primaryModelId,
            modelNames,
            input,
          );
        }

        if (Object.keys(llmAgentsModels).length > 0) {
          output.provider["llm-agents"] = {
            ...providerOpts,
            models: llmAgentsModels,
          };
        }

        const categoryRouting = input.routing.routing?.categories ?? {};
        const hasExplicitCategoryRouting =
          Object.keys(categoryRouting).length > 0;
        if (
          input.context.allCategories &&
          Object.keys(input.context.allCategories).length > 0
        ) {
          const llmCategoriesModels: Record<string, unknown> = {};

          for (const [categoryName, category] of Object.entries(
            input.context.allCategories,
          )) {
            if (hasExplicitCategoryRouting && !categoryRouting[categoryName]) {
              continue;
            }

            const primaryModelId =
              category.model || configDefaultModel || categoryName;

            addRoleModelSlots(
              llmCategoriesModels,
              categoryName,
              categoryName,
              primaryModelId,
              modelNames,
              input,
            );
          }

          if (Object.keys(llmCategoriesModels).length > 0) {
            output.provider["llm-categories"] = {
              ...providerOpts,
              models: llmCategoriesModels,
            };
          }
        }

        const globalFallbackId = input.context.globalFallbackModel;
        if (globalFallbackId) {
          const globalSpec = input.context.allModels[globalFallbackId];
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
      },
      validate(output): boolean {
        const result = opencodeSchema.safeParse(output);
        if (!result.success) {
          console.error(
            "[OpenCodePlugin] Validation failed:",
            result.error.issues,
          );
        }
        return result.success;
      },
    },
  };
}

export class OpenCodePlugin {
  readonly id = openCodeManifest.id;
  readonly name = openCodeManifest.displayName;
  readonly version = 1;

  getInternalAgents() {
    return openCodeManifest.internalAgents;
  }

  getConfigSchema() {
    return openCodeManifest.configSchema;
  }

  buildOutput(
    agents: SystemAgent[],
    routing: PluginRouting,
    context: Parameters<
      ReturnType<typeof createOpenCodePlugin>["handlers"]["build"]
    >[0]["context"],
  ) {
    return createOpenCodePlugin().handlers.build({
      agents,
      routing: {
        ...routing,
        config: openCodePluginConfigSchema.parse(routing.config ?? {}),
      },
      context,
    });
  }

  validate(output: unknown): boolean {
    return (
      createOpenCodePlugin().handlers.validate?.(output as OpenCodeProviders) ??
      true
    );
  }

  getOutputFile(): string {
    return openCodeManifest.output.fileName;
  }
}
