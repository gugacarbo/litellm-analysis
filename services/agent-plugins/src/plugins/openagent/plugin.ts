import type {
  OpenAgentPluginConfig,
  SystemAgent,
} from "@lite-llm/agents-repository/schemas";
import type { IPlugin, TransformContext, TypedPluginRouting } from "../plugin";
import type {
  ConfigField,
  InternalAgent,
  PluginConfigFor,
} from "../plugin-types";
import { openAgentSchema } from "./schemas/generated/openagent.zod";

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

export class OpenAgentPlugin implements IPlugin<"openagent"> {
  readonly id = "openagent";
  readonly name = "Oh My OpenAgent";
  readonly version = 1;
  readonly outputFile = "oh-my-openagent.json";

  getInternalAgents(): InternalAgent[] {
    return [
      {
        id: "default",
        displayName: "Default",
        description: "Default OpenAgent",
      },
    ];
  }

  getConfigSchema(): ConfigField[] {
    return [
      {
        key: "commitFooter",
        type: "boolean",
        label: "Commit Footer",
        required: false,
        default: false,
        description: "Add footer to commit messages",
      },
      {
        key: "includeCoAuthoredBy",
        type: "boolean",
        label: "Include Co-Authored-By",
        required: false,
        default: false,
        description: "Include co-authored-by trailer in commits",
      },
    ];
  }

  buildOutput(
    agents: SystemAgent[],
    routing: TypedPluginRouting<PluginConfigFor<"openagent">>,
    ctx: TransformContext,
  ): OpenAgentOutput {
    const config: OpenAgentPluginConfig = (routing.config ??
      {}) as OpenAgentPluginConfig;
    const schemaUrl =
      config.$schema ??
      "https://raw.githubusercontent.com/opensoft/oh-my-opencode/dev/assets/oh-my-opencode.schema.json";

    const output: OpenAgentOutput = {
      $schema: schemaUrl,
      globalFallbackModel: ctx.globalFallbackModel,
      git_master: {
        commit_footer: config.commitFooter ?? false,
        include_co_authored_by: config.includeCoAuthoredBy ?? false,
      },
      agents: {},
      categories: {},
    };

    const agentMappings = routing.routing?.agents ?? {};

    for (const agent of agents) {
      const internalId = agentMappings[agent.displayName];
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
    if (ctx.allCategories) {
      for (const [categoryName, category] of Object.entries(
        ctx.allCategories,
      )) {
        if (!categoryRouting[categoryName]) continue;

        const catEntry: Record<string, unknown> = {};
        if (category.description) catEntry.description = category.description;
        if (category.model) catEntry.model = category.model;

        if (Object.keys(catEntry).length > 0) {
          output.categories[categoryName] = catEntry;
        }
      }
    }

    return output;
  }

  validate(output: unknown): boolean {
    const result = openAgentSchema.safeParse(output);
    if (!result.success) {
      console.error(
        "[OpenAgentPlugin] Validation failed:",
        result.error.issues,
      );
    }
    return result.success;
  }

  getOutputFile(): string {
    return this.outputFile;
  }
}
