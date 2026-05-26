import { sortAliasesByDefinitionOrder } from "@lite-llm/models-service";
import { normalizeAgentMappings } from "../../helpers";
import type { PluginRoutingFor, PluginRuntimeContext } from "../../sdk";
import type { SystemAgent } from "../../types";
import type { LitellmAliasPluginConfig } from "./plugin.config";
import { generateLitellmAliases } from "./generate";
import type { LitellmAliasSchemaType } from "./plugin.schema";

type AgentWithId = SystemAgent & { id: string };
const DEFAULT_MODEL_NAMES = ["gpt-5.5", "gpt-5.4"] as const;

export interface BuildLitellmAliasOutputInput {
  agents: SystemAgent[];
  routing: PluginRoutingFor<LitellmAliasPluginConfig>;
  context: PluginRuntimeContext;
  config: LitellmAliasPluginConfig;
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
    if (hasAgentRouting && !routingAgents[agent.id]?.length) {
      continue;
    }

    const agentModel =
      agent.model && enabledSet.has(agent.model) ? agent.model : "";
    if (!agentModel) {
      continue;
    }

    Object.assign(
      aliases,
      generateLitellmAliases(
        agent.id,
        agentModel,
        effectiveFallback,
        modelNames,
      ),
    );
  }

  for (const [key, category] of Object.entries(context.allCategories ?? {})) {
    if (hasCategoryRouting && !routingCategories[key]) {
      continue;
    }

    if (!(category.model && enabledSet.has(category.model))) {
      continue;
    }

    Object.assign(
      aliases,
      generateLitellmAliases(
        key,
        category.model && enabledSet.has(category.model) ? category.model : "",
        effectiveFallback,
        modelNames,
      ),
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
