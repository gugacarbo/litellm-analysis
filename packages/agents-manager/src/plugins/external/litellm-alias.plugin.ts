import type {
  PluginRouting,
  SystemAgent,
} from "@lite-llm/agents-repository/schemas";
import {
  generateLitellmAliases,
  sortAliasesByDefinitionOrder,
} from "@lite-llm/models-manager";
import type { IPlugin, TransformContext } from "../plugin";
import type { ConfigField, InternalAgent } from "../plugin-types";

export interface AliasDbWriter {
  updateAliases(aliases: Record<string, string>): Promise<void>;
}

interface LitellmAliasOutput {
  model_group_alias: Record<string, string>;
}

type AgentWithId = SystemAgent & { id: string };

export class LitellmAliasPlugin implements IPlugin {
  readonly id = "litellm-alias";
  readonly name = "LiteLLM Router Aliases";
  readonly version = 1;
  readonly outputFile = "litellm-aliases.json";

  private dbWriter?: AliasDbWriter;

  constructor(dbWriter?: AliasDbWriter) {
    this.dbWriter = dbWriter;
  }

  getInternalAgents(): InternalAgent[] {
    return [];
  }

  getConfigSchema(): ConfigField[] {
    return [
      {
        key: "aliasPrefix",
        type: "string",
        label: "Alias Prefix",
        required: false,
        default: "",
        placeholder: "e.g. prod:",
        description: "Text prepended to all generated alias names",
      },
      {
        key: "includeAgents",
        type: "boolean",
        label: "Include Agents",
        required: false,
        default: true,
        description: "Include agent-based aliases in output",
      },
      {
        key: "includeCategories",
        type: "boolean",
        label: "Include Categories",
        required: false,
        default: true,
        description: "Include category-based aliases in output",
      },
      {
        key: "globalFallbackOverride",
        type: "string",
        label: "Global Fallback Override",
        required: false,
        default: "",
        placeholder: "e.g. gpt-4o-mini",
        description: "Override global fallback model (empty = use default)",
      },
    ];
  }

  getOutputFile(): string {
    return this.outputFile;
  }

  buildOutput(
    agents: SystemAgent[],
    _routing: PluginRouting,
    ctx: TransformContext,
  ): LitellmAliasOutput {
    const aliases: Record<string, string> = {};
    const globalFallback = ctx.globalFallbackModel;

    for (const agent of agents as AgentWithId[]) {
      Object.assign(
        aliases,
        generateLitellmAliases(
          agent.id,
          agent.model || "",
          agent.fallbackModels,
          globalFallback,
        ),
      );
    }

    const enabledCategories = _routing.routing.categories ?? {};
    for (const [key, category] of Object.entries(ctx.allCategories ?? {})) {
      // Only process categories explicitly enabled in routing config
      if (!enabledCategories[key]) {
        continue;
      }

      // Skip categories with no model and no fallback models configured
      const hasModel = Boolean(category.model);
      const hasFallbacks = (category.fallbackModels?.length ?? 0) > 0;
      if (!hasModel && !hasFallbacks) {
        continue;
      }

      Object.assign(
        aliases,
        generateLitellmAliases(
          key,
          category.model || "",
          category.fallbackModels,
          globalFallback,
        ),
      );
    }

    return {
      model_group_alias: sortAliasesByDefinitionOrder(aliases),
    };
  }

  async afterExport(output: unknown): Promise<void> {
    if (!this.dbWriter) return;

    try {
      const { model_group_alias } = output as LitellmAliasOutput;
      await this.dbWriter.updateAliases(model_group_alias);
    } catch (error) {
      console.error(
        `[LitellmAliasPlugin] Failed to sync aliases to DB: ${error}`,
      );
    }
  }
}
