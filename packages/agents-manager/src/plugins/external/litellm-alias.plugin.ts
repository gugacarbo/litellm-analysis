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
        key: "selectedAgents",
        type: "multiselect",
        label: "Selected Agents",
        required: false,
        default: [],
        description: "Which agents to include (empty = all).",
        options: [],
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
        key: "selectedCategories",
        type: "multiselect",
        label: "Selected Categories",
        required: false,
        default: [],
        description: "Which categories to include (empty = all).",
        options: [],
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
    const config = _routing.config ?? {};
    const aliasPrefix = (config.aliasPrefix as string) ?? "";
    const includeAgents = (config.includeAgents as boolean) ?? true;
    const includeCategories = (config.includeCategories as boolean) ?? true;
    const globalFallbackOverride =
      (config.globalFallbackOverride as string) ?? "";
    const effectiveFallback = globalFallbackOverride || ctx.globalFallbackModel;

    // Parse selections into Sets (empty array = all)
    const selectedAgentsArr = (config.selectedAgents as string[]) ?? [];
    const selectedCategoriesArr = (config.selectedCategories as string[]) ?? [];
    const selectedAgentsSet = selectedAgentsArr.length
      ? new Set(selectedAgentsArr)
      : null;
    const selectedCategoriesSet = selectedCategoriesArr.length
      ? new Set(selectedCategoriesArr)
      : null;

    if (includeAgents) {
      for (const agent of agents as AgentWithId[]) {
        // Filter by selectedAgentsSet when not null
        if (selectedAgentsSet && !selectedAgentsSet.has(agent.id)) {
          continue;
        }

        const finalKey = aliasPrefix ? `${aliasPrefix}${agent.id}` : agent.id;
        Object.assign(
          aliases,
          generateLitellmAliases(
            finalKey,
            agent.model || "",
            agent.fallbackModels,
            effectiveFallback,
          ),
        );
      }
    }

    if (includeCategories) {
      const enabledCategories = _routing.routing.categories ?? {};
      for (const [key, category] of Object.entries(ctx.allCategories ?? {})) {
        if (!enabledCategories[key]) {
          continue;
        }

        // Filter by selectedCategoriesSet when not null
        if (selectedCategoriesSet && !selectedCategoriesSet.has(key)) {
          continue;
        }

        const hasModel = Boolean(category.model);
        const hasFallbacks = (category.fallbackModels?.length ?? 0) > 0;
        if (!hasModel && !hasFallbacks) {
          continue;
        }

        const finalKey = aliasPrefix ? `${aliasPrefix}${key}` : key;
        Object.assign(
          aliases,
          generateLitellmAliases(
            finalKey,
            category.model || "",
            category.fallbackModels,
            effectiveFallback,
          ),
        );
      }
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
