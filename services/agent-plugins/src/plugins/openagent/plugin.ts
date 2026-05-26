import { normalizeAgentMappings } from "../../helpers";
import type { PluginDefinition } from "../../sdk";
import type { PluginRouting, SystemAgent } from "../../types";
import {
  type OpenAgentPluginConfig,
  openAgentPluginConfigSchema,
} from "./plugin.config";
import { type OpenAgentOutput, openAgentManifest } from "./plugin.manifest";
import { openagentSchema } from "./plugin.schema";

export function createOpenAgentPlugin(): PluginDefinition<
  "openagent",
  OpenAgentPluginConfig,
  OpenAgentOutput
> {
  return {
    manifest: openAgentManifest,
    handlers: {
      build(input): OpenAgentOutput {
        const { agents, routing, context } = input;
        const config = openAgentPluginConfigSchema.parse(routing.config ?? {});

        const output: OpenAgentOutput = {
          $schema: config.$schema,
          globalFallbackModel: context.globalFallbackModel,
          git_master: {
            commit_footer: config.commitFooter,
            include_co_authored_by: config.includeCoAuthoredBy,
          },
          agents: {},
          categories: {},
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

          output.agents[internalId] = entry;
        }

        const categoryRouting = routing.routing?.categories ?? {};
        if (context.allCategories) {
          for (const [categoryName, category] of Object.entries(
            context.allCategories,
          )) {
            if (!categoryRouting[categoryName]) continue;

            const catEntry: Record<string, unknown> = {};
            if (category.description)
              catEntry.description = category.description;
            if (category.model) catEntry.model = category.model;

            if (Object.keys(catEntry).length > 0) {
              output.categories[categoryName] = catEntry;
            }
          }
        }

        return output;
      },
      validate(output): boolean {
        const result = openagentSchema.safeParse(output);
        if (!result.success) {
          console.error(
            "[OpenAgentPlugin] Validation failed:",
            result.error.issues,
          );
        }
        return result.success;
      },
    },
  };
}

export class OpenAgentPlugin {
  readonly id = openAgentManifest.id;
  readonly name = openAgentManifest.displayName;
  readonly version = 1;

  getInternalAgents() {
    return openAgentManifest.internalAgents;
  }

  getConfigSchema() {
    return openAgentManifest.configSchema;
  }

  buildOutput(
    agents: SystemAgent[],
    routing: PluginRouting,
    context: Parameters<
      ReturnType<typeof createOpenAgentPlugin>["handlers"]["build"]
    >[0]["context"],
  ) {
    return createOpenAgentPlugin().handlers.build({
      agents,
      routing: {
        ...routing,
        config: openAgentPluginConfigSchema.parse(routing.config ?? {}),
      },
      context,
    });
  }

  validate(output: unknown): boolean {
    return (
      createOpenAgentPlugin().handlers.validate?.(output as OpenAgentOutput) ??
      true
    );
  }

  getOutputFile(): string {
    return openAgentManifest.output.fileName;
  }
}
