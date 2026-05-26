import { normalizeAgentMappings } from "../../../helpers";
import type { PluginRoutingFor, PluginRuntimeContext } from "../../../sdk";
import type { SystemAgent } from "../../../types";
import { agentAdapter } from "./agent-adapter";
import { modelAdapter } from "./model-adapter";
import type { WeavePluginConfig } from "../config/config";
import { WEAVE_AGENTS } from "../manifest/manifest";
import type { WeaveSchemaType } from "../schema/schema";

const DEFAULT_MODEL_NAMES = ["gpt-5.5", "gpt-5.4"] as const;

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

    outputAgents[weaveAgent.id] = agentAdapter(
      weaveAgent,
      systemAgent,
      modelNames,
    );
  }

  const outputCategories: NonNullable<WeaveSchemaType["categories"]> = {};
  const categoryRouting = routing.routing?.categories ?? {};
  for (const [categoryId, enabled] of Object.entries(categoryRouting)) {
    if (!enabled) continue;

    const systemCat = context.allCategories?.[categoryId];
    if (!systemCat) continue;

    const modelData = modelAdapter(
      categoryId,
      systemCat.model ?? "",
      modelNames,
    );

    outputCategories[categoryId] = {
      description: systemCat.description ?? "",
      ...modelData,
      temperature: systemCat.temperature ?? 0.2,
    };
  }

  return {
    ...config,
    agents: outputAgents,
    categories: outputCategories,
  };
}
