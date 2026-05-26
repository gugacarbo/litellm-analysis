import type {
  OpenAgentPluginConfig,
  PluginRouting,
  SystemAgent,
} from "@lite-llm/agents-repository/schemas";
import {
  OPENAGENT_COMMIT_FOOTER_DEFAULT,
  OPENAGENT_INCLUDE_CO_AUTHORED_BY_DEFAULT,
  OPENAGENT_SCHEMA_URL_DEFAULT,
  openAgentPluginConfigSchema,
} from "@lite-llm/agents-repository/schemas";
import { normalizeAgentMappings } from "../../helpers";
import type { PluginDefinition, PluginManifest } from "../../sdk";
import { openagentSchema } from "./plugin.schema";

interface OpenAgentOutput {
  $schema: string;
  globalFallbackModel?: string;
  git_master: {
    commit_footer: boolean;
    include_co_authored_by: boolean;
  };
  agents: Record<string, Record<string, unknown>>;
  categories: Record<string, Record<string, unknown>>;
}

export const openAgentManifest: PluginManifest<
  "openagent",
  OpenAgentPluginConfig,
  OpenAgentOutput
> = {
  id: "openagent",
  displayName: "Oh My OpenAgent",
  version: 2,
  output: { fileName: "oh-my-openagent.json" },
  capabilities: {
    usesAgents: true,
    usesCategories: true,
    usesModels: false,
  },
  internalAgents: [
    {
      id: "default",
      displayName: "Default",
      description: "Default OpenAgent",
    },
  ],
  configSchema: [
    {
      key: "commitFooter",
      type: "boolean",
      label: "Commit Footer",
      required: false,
      default: OPENAGENT_COMMIT_FOOTER_DEFAULT,
      description: "Add footer to commit messages",
    },
    {
      key: "includeCoAuthoredBy",
      type: "boolean",
      label: "Include Co-Authored-By",
      required: false,
      default: OPENAGENT_INCLUDE_CO_AUTHORED_BY_DEFAULT,
      description: "Include co-authored-by trailer in commits",
    },
  ],
  configZodSchema: openAgentPluginConfigSchema,
};

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
        const config: OpenAgentPluginConfig = routing.config ?? {};
        const schemaUrl = config.$schema ?? OPENAGENT_SCHEMA_URL_DEFAULT;

        const output: OpenAgentOutput = {
          $schema: schemaUrl,
          globalFallbackModel: context.globalFallbackModel,
          git_master: {
            commit_footer:
              config.commitFooter ?? OPENAGENT_COMMIT_FOOTER_DEFAULT,
            include_co_authored_by:
              config.includeCoAuthoredBy ??
              OPENAGENT_INCLUDE_CO_AUTHORED_BY_DEFAULT,
          },
          agents: {},
          categories: {},
        };

        const rawAgentMappings: Record<string, string | string[]> =
          (routing.routing?.agents as Record<string, string | string[]>) ?? {};
        const agentMappings = normalizeAgentMappings(rawAgentMappings);

        for (const agent of agents) {
          const internalId = agentMappings[agent.displayName]?.[0];
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
    return createOpenAgentPlugin().handlers.build({ agents, routing, context });
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
