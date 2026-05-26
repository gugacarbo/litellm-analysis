import { sortAliasesByDefinitionOrder } from "@lite-llm/models-service";
import { normalizeAgentMappings } from "../../../helpers";
import type { PluginRoutingFor, PluginRuntimeContext } from "../../../sdk";
import type { SystemAgent } from "../../../types";
import type { LitellmAliasPluginConfig } from "../config/config";
import { generateLitellmAliases } from "../generate";
import type { LitellmAliasSchemaType } from "../schema/schema";

type AgentWithId = SystemAgent & { id: string };
const DEFAULT_MODEL_NAMES = ["gpt-5.5", "gpt-5.4"] as const;

export interface BuildLitellmAliasOutputInput {
  agents: SystemAgent[];
  routing: PluginRoutingFor<LitellmAliasPluginConfig>;
  context: PluginRuntimeContext;
  config: LitellmAliasPluginConfig;
}

function modelAdapter(
  model: string | undefined,
  enabledSet: Set<string>,
): string | null {
  if (!model || !enabledSet.has(model)) {
    return null;
  }
  return model;
}

function agentAdapter(
  agent: AgentWithId,
  routingAgents: Record<string, string[]>,
  hasAgentRouting: boolean,
  enabledSet: Set<string>,
): { id: string; model: string } | null {
  if (hasAgentRouting && !routingAgents[agent.id]?.length) {
    return null;
  }

  const model = modelAdapter(agent.model, enabledSet);
  if (!model) {
    return null;
  }

  return { id: agent.id, model };
}

export function adaptLitellmAliasOutput(
  input: BuildLitellmAliasOutputInput,
): LitellmAliasSchemaType {
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
      generateLitellmAliases(
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
      generateLitellmAliases(key, categoryModel, effectiveFallback, modelNames),
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
