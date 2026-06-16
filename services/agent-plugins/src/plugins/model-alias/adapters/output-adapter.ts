import { sortAliasesByDefinitionOrder } from "@lite-llm/models-service";
import { normalizeAgentMappings } from "../../../helpers";
import type { PluginRoutingFor, PluginRuntimeContext } from "../../../sdk";
import type { SystemAgent } from "../../../types";
import type { ModelAliasPluginConfig } from "../config/config";
import { generateModelAliases } from "../generate";
import type { ModelAliasSchemaType } from "../schema/schema";
import { agentAdapter } from "./agent-adapter";
import { modelAdapter } from "./model-adapter";

type AgentWithId = SystemAgent & { id: string };
const DEFAULT_MODEL_NAMES = ["gpt-5.5", "gpt-5.4"] as const;

export interface BuildModelAliasOutputInput {
  agents: SystemAgent[];
  routing: PluginRoutingFor<ModelAliasPluginConfig>;
  context: PluginRuntimeContext;
  config: ModelAliasPluginConfig;
}

export function adaptModelAliasOutput(
  input: BuildModelAliasOutputInput,
): ModelAliasSchemaType {
  const { agents, routing, context, config } = input;
  const aliases: Record<string, string> = {};
  const rawFallback = context.globalFallbackModel;

  const enabledSet = new Set(
    Object.entries(context.allModels)
      .filter(([, spec]) => spec.enabled !== false)
      .map(([name]) => name),
  );

  const effectiveFallback =
    rawFallback && enabledSet.has(rawFallback) ? rawFallback : undefined;

  const modelNames: readonly string[] =
    context.modelNames ?? DEFAULT_MODEL_NAMES;

  const agentKeys = agents.map((a) => (a as AgentWithId).id);
  const categoryKeys = Object.keys(context.allCategories ?? {});

  const rawRoutingAgents: Record<string, string | string[]> =
    (routing.routing?.agents as Record<string, string | string[]>) ?? {};
  const routingAgents = normalizeAgentMappings(rawRoutingAgents);
  const routingCategories = routing.routing?.categories ?? {};
  const hasAgentRouting = Object.keys(routingAgents).length > 0;
  const hasCategoryRouting = Object.keys(routingCategories).length > 0;

  for (const agent of agents as AgentWithId[]) {
    const adaptedAgent = agentAdapter(
      agent,
      routingAgents,
      hasAgentRouting,
      enabledSet,
    );
    if (!adaptedAgent) continue;

    Object.assign(
      aliases,
      generateModelAliases(
        adaptedAgent.id,
        adaptedAgent.model,
        effectiveFallback,
        modelNames,
      ),
    );
  }

  for (const [key, category] of Object.entries(context.allCategories ?? {})) {
    if (hasCategoryRouting && !routingCategories[key]) {
      continue;
    }

    const categoryModel = modelAdapter(category.model, enabledSet);
    if (!categoryModel) continue;

    Object.assign(
      aliases,
      generateModelAliases(key, categoryModel, effectiveFallback, modelNames),
    );
  }

  return {
    $schema: config.$schema,
    model_group_alias: sortAliasesByDefinitionOrder(
      aliases,
      agentKeys,
      categoryKeys,
    ),
  };
}
