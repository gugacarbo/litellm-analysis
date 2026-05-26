import { normalizeAgentMappings } from "../../helpers";
import type { PluginRoutingFor, PluginRuntimeContext } from "../../sdk";
import type { SystemAgent } from "../../types";
import type { WeavePluginConfig } from "./plugin.config";
import { WEAVE_AGENTS } from "./plugin.manifest";
import type { WeaveSchemaType } from "./plugin.schema";

const DEFAULT_MODEL_NAMES = ["gpt-5.5", "gpt-5.4"] as const;

function resolveModels(role: string, modelNames: readonly string[]): string[] {
  return modelNames.map((slot) => `${role}/${slot}`);
}

export interface BuildWeaveOutputInput {
  agents: SystemAgent[];
  routing: PluginRoutingFor<WeavePluginConfig>;
  context: PluginRuntimeContext;
  config: WeavePluginConfig;
}

export function adaptWeaveOutput(
  input: BuildWeaveOutputInput,
): WeaveSchemaType {
  const { agents, routing, context, config } = input;
  const modelNames = context.modelNames ?? DEFAULT_MODEL_NAMES;

  const rawAgentMappings: Record<string, string | string[]> =
    (routing.routing?.agents as Record<string, string | string[]>) ?? {};
  const agentMappings = normalizeAgentMappings(rawAgentMappings);

  const systemAgentMap = new Map<string, SystemAgent>();
  for (const agent of agents) {
    const systemId = agent.id ?? agent.displayName ?? "";
    if (systemId) {
      systemAgentMap.set(systemId, agent);
    }
  }

  const outputAgents: NonNullable<WeaveSchemaType["agents"]> = {};

  for (const weaveAgent of WEAVE_AGENTS) {
    const systemAgentId = agentMappings[weaveAgent.id]?.[0];
    if (!systemAgentId) continue;

    const systemAgent = systemAgentMap.get(systemAgentId);
    if (!systemAgent) continue;

    const model = systemAgent.model ?? "";
    const models = model ? resolveModels(systemAgentId, modelNames) : [];

    outputAgents[weaveAgent.id] = {
      display_name: systemAgent.displayName ?? weaveAgent.displayName,
      model: models[0] ?? model,
      fallback_models: models.slice(1),
      temperature: systemAgent.config?.temperature ?? 0.2,
      color: systemAgent.config?.color ?? "",
      category: weaveAgent.category,
    };
  }

  const outputCategories: NonNullable<WeaveSchemaType["categories"]> = {};
  const categoryRouting = routing.routing?.categories ?? {};
  for (const [categoryId, enabled] of Object.entries(categoryRouting)) {
    if (!enabled) continue;

    const systemCat = context.allCategories?.[categoryId];
    if (!systemCat) continue;

    const catModel = systemCat.model ?? "";
    const models = catModel ? resolveModels(categoryId, modelNames) : [];

    outputCategories[categoryId] = {
      description: systemCat.description ?? "",
      model: models[0] ?? catModel,
      fallback_models: models.slice(1),
      temperature: systemCat.temperature ?? 0.2,
    };
  }

  return {
    ...config,
    agents: outputAgents,
    categories: outputCategories,
  };
}
