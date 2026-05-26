import { normalizeAgentMappings } from "../../helpers";
import type { PluginRoutingFor, PluginRuntimeContext } from "../../sdk";
import type { SystemAgent } from "../../types";
import type { OpenAgentPluginConfig } from "./plugin.config";
import type { OpenagentSchemaType } from "./plugin.schema";

export interface BuildOpenAgentOutputInput {
  agents: SystemAgent[];
  routing: PluginRoutingFor<OpenAgentPluginConfig>;
  context: PluginRuntimeContext;
  config: OpenAgentPluginConfig;
}

export function adaptOpenAgentOutput(
  input: BuildOpenAgentOutputInput,
): OpenagentSchemaType {
  const { agents, routing, context, config } = input;
  const outputAgents: Record<string, Record<string, unknown>> = {};
  const outputCategories: Record<string, Record<string, unknown>> = {};

  const output = {
    $schema: config.$schema,
    git_master: config.git_master,
    agents: outputAgents,
    categories: outputCategories,
    ...(context.globalFallbackModel
      ? { globalFallbackModel: context.globalFallbackModel }
      : {}),
  };

  const rawAgentMappings: Record<string, string | string[]> =
    (routing.routing?.agents as Record<string, string | string[]>) ?? {};
  const agentMappings = normalizeAgentMappings(rawAgentMappings);

  for (const agent of agents) {
    const agentName = agent.displayName;
    if (!agentName) continue;

    const internalId = agentMappings[agentName]?.[0];
    if (!internalId) continue;

    const entry: Record<string, unknown> = {};
    if (agent.description) entry.description = agent.description;
    if (agent.model) entry.model = agent.model;
    if (agent.config?.mode) entry.mode = agent.config.mode;
    if (agent.config?.tools) entry.tools = agent.config.tools;
    if (agent.config?.color) entry.color = agent.config.color;

    outputAgents[internalId] = entry;
  }

  const categoryRouting = routing.routing?.categories ?? {};
  if (context.allCategories) {
    for (const [categoryName, category] of Object.entries(
      context.allCategories,
    )) {
      if (!categoryRouting[categoryName]) continue;

      const catEntry: Record<string, unknown> = {};
      if (category.description) catEntry.description = category.description;
      if (category.model) catEntry.model = category.model;

      if (Object.keys(catEntry).length > 0) {
        outputCategories[categoryName] = catEntry;
      }
    }
  }

  return output;
}
