import type { ModelSpec } from "@lite-llm/models-repository/schemas";
import { normalizeAgentMappings } from "../../../helpers";
import type { PluginRoutingFor, PluginRuntimeContext } from "../../../sdk";
import type { SystemAgent } from "../../../types";
import { resolveSlotModelId } from "../../litellm-alias/generate";
import type { OpenCodePluginConfig } from "../config/config";
import type { OpencodeSchemaType } from "../schema/schema";

const DEFAULT_MODEL_NAMES = ["gpt-5.5", "gpt-5.4"] as const;
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
  if (normalized === "off" || normalized === "disabled") return "none";
  if (OPENCODE_REASONING_EFFORT_LEVELS.has(normalized)) return normalized;
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
    variants[normalizedLevel] = { reasoningEffort: normalizedLevel };
  }
  return Object.keys(variants).length > 0 ? variants : undefined;
}

function modelAdapter(
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
  context: PluginRuntimeContext,
): void {
  for (let i = 0; i < modelNames.length; i++) {
    const modelId = resolveSlotModelId(
      i,
      modelNames.length,
      primaryModelId,
      context.globalFallbackModel,
    );
    if (!modelId) continue;

    const spec = context.allModels[modelId];
    if (!spec) continue;

    const slotDisplayName = i === 0 ? displayName : `${displayName} ${i}`;
    target[`${role}/${modelNames[i]}`] = modelAdapter(
      role,
      modelNames[i],
      slotDisplayName,
      spec,
    );
  }
}

function agentAdapter(
  agent: SystemAgent,
  enabledAgents: Record<string, string[]>,
  configDefaultModel: string,
  context: PluginRuntimeContext,
): { role: string; displayName: string; primaryModelId: string } | null {
  const role = Object.entries(enabledAgents).find(([, agentIds]) =>
    agentIds.includes(agent.id ?? ""),
  )?.[0];
  if (!role) return null;

  const primaryModelId: string =
    agent.model || configDefaultModel || agent.id || "";
  const displayName =
    agent.displayName ||
    (primaryModelId ? context.allModels[primaryModelId]?.displayName : "") ||
    role;

  return { role, displayName, primaryModelId };
}

export interface BuildOpenCodeOutputInput {
  agents: SystemAgent[];
  routing: PluginRoutingFor<OpenCodePluginConfig>;
  context: PluginRuntimeContext;
  config: OpenCodePluginConfig;
}

export function adaptOpenCodeOutput(
  input: BuildOpenCodeOutputInput,
): OpencodeSchemaType {
  const { agents, routing, context, config } = input;
  const configDefaultModel = config.model ?? "";
  const modelNames = context.modelNames ?? DEFAULT_MODEL_NAMES;
  const outputProvider: NonNullable<OpencodeSchemaType["provider"]> = {};

  const output = {
    $schema: config.$schema,
    provider: outputProvider,
  };

  const providerOpts = {
    npm: "@ai-sdk/openai-compatible",
    options: {
      baseURL: context.litellmConfig.baseUrl,
      apiKey: context.litellmConfig.apiKey,
    },
  };

  const litellmModels: Record<string, Record<string, unknown>> = {};
  for (const [key, spec] of Object.entries(context.allModels)) {
    litellmModels[key] = modelAdapter(key, key, spec.displayName, spec);
  }

  output.provider.litellm = {
    name: "LiteLLM",
    ...providerOpts,
    models: litellmModels,
  };

  const rawEnabledAgents: Record<string, string | string[]> =
    (routing.routing?.agents as Record<string, string | string[]>) ?? {};
  const enabledAgents = normalizeAgentMappings(rawEnabledAgents);
  const llmAgentsModels: Record<string, Record<string, unknown>> = {};

  for (const agent of agents) {
    const adaptedAgent = agentAdapter(
      agent,
      enabledAgents,
      configDefaultModel,
      context,
    );
    if (!adaptedAgent) continue;

    addRoleModelSlots(
      llmAgentsModels,
      adaptedAgent.role,
      adaptedAgent.displayName,
      adaptedAgent.primaryModelId,
      modelNames,
      context,
    );
  }

  if (Object.keys(llmAgentsModels).length > 0) {
    output.provider["llm-agents"] = {
      ...providerOpts,
      models: llmAgentsModels,
    };
  }

  const categoryRouting = routing.routing?.categories ?? {};
  const hasExplicitCategoryRouting = Object.keys(categoryRouting).length > 0;
  if (context.allCategories && Object.keys(context.allCategories).length > 0) {
    const llmCategoriesModels: Record<string, Record<string, unknown>> = {};

    for (const [categoryName, category] of Object.entries(
      context.allCategories,
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
        context,
      );
    }

    if (Object.keys(llmCategoriesModels).length > 0) {
      output.provider["llm-categories"] = {
        ...providerOpts,
        models: llmCategoriesModels,
      };
    }
  }

  const globalFallbackId = context.globalFallbackModel;
  if (globalFallbackId) {
    const globalSpec = context.allModels[globalFallbackId];
    if (globalSpec) {
      const primarySlot = modelNames[0];
      const globalFallbackEntry = modelAdapter(
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
