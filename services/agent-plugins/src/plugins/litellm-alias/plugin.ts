import type {
  LitellmAliasPluginConfig,
  SystemAgent,
} from "@lite-llm/agents-repository/schemas";
import {
  generateLitellmAliases,
  sortAliasesByDefinitionOrder,
} from "@lite-llm/models-service";
import type { IPlugin, TransformContext, TypedPluginRouting } from "../plugin";
import type {
  ConfigField,
  InternalAgent,
  PluginConfigFor,
} from "../plugin-types";
import { litellmAliasSchema } from "./schemas/generated/litellm-alias.zod";

export interface AliasDbWriter {
  updateAliases(aliases: Record<string, string>): Promise<void>;
}

interface LitellmAliasOutput {
  $schema: string;
  model_group_alias: Record<string, string>;
}

type AgentWithId = SystemAgent & { id: string };

export class LitellmAliasPlugin implements IPlugin<"litellm-alias"> {
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
    _routing: TypedPluginRouting<PluginConfigFor<"litellm-alias">>,
    ctx: TransformContext,
  ): LitellmAliasOutput {
    const aliases: Record<string, string> = {};
    const config: LitellmAliasPluginConfig = (_routing.config ??
      {}) as LitellmAliasPluginConfig;
    const aliasPrefix = config.aliasPrefix ?? "";
    const includeAgents = config.includeAgents ?? true;
    const includeCategories = config.includeCategories ?? true;
    const globalFallbackOverride = config.globalFallbackOverride ?? "";
    const rawFallback = globalFallbackOverride || ctx.globalFallbackModel;

    // Build set of enabled model names
    const enabledSet = new Set(
      Object.entries(ctx.allModels)
        .filter(([, spec]) => spec.enabled !== false)
        .map(([name]) => name),
    );

    const effectiveFallback =
      rawFallback && enabledSet.has(rawFallback) ? rawFallback : undefined;

    // Read routing mappings (empty object = all enabled)
    const routingAgents = _routing.routing?.agents ?? {};
    const routingCategories = _routing.routing?.categories ?? {};
    const hasAgentRouting = Object.keys(routingAgents).length > 0;
    const hasCategoryRouting = Object.keys(routingCategories).length > 0;

    if (includeAgents) {
      for (const agent of agents as AgentWithId[]) {
        // Filter by routing.agents when present (empty routing = all enabled)
        if (hasAgentRouting && !routingAgents[agent.id]) {
          continue;
        }

        const agentModel =
          agent.model && enabledSet.has(agent.model) ? agent.model : "";
        const agentFallbacks = (agent.fallbackModels ?? []).filter((m) =>
          enabledSet.has(m),
        );

        // Skip if no enabled model or fallbacks
        if (!agentModel && agentFallbacks.length === 0) {
          continue;
        }

        const finalKey = aliasPrefix ? `${aliasPrefix}${agent.id}` : agent.id;
        Object.assign(
          aliases,
          generateLitellmAliases(
            finalKey,
            agentModel,
            agentFallbacks,
            effectiveFallback,
          ),
        );
      }
    }

    if (includeCategories) {
      for (const [key, category] of Object.entries(ctx.allCategories ?? {})) {
        // Filter by routing.categories when present (empty routing = all enabled)
        // Only include categories that are explicitly enabled in routing
        if (hasCategoryRouting && !routingCategories[key]) {
          continue;
        }

        const hasModel = Boolean(
          category.model && enabledSet.has(category.model),
        );
        const catFallbacks = (category.fallbackModels ?? []).filter((m) =>
          enabledSet.has(m),
        );
        const hasFallbacks = catFallbacks.length > 0;
        if (!hasModel && !hasFallbacks) {
          continue;
        }

        const finalKey = aliasPrefix ? `${aliasPrefix}${key}` : key;
        Object.assign(
          aliases,
          generateLitellmAliases(
            finalKey,
            category.model && enabledSet.has(category.model)
              ? category.model
              : "",
            catFallbacks,
            effectiveFallback,
          ),
        );
      }
    }

    return {
      $schema:
        "https://raw.githubusercontent.com/opensoft/lite-llm-analytics/main/services/agent-plugins/src/plugins/litellm-alias/schemas/litellm-alias.schema.json",
      model_group_alias: sortAliasesByDefinitionOrder(aliases),
    };
  }

  validate(output: unknown): boolean {
    const result = litellmAliasSchema.safeParse(output);
    if (!result.success) {
      console.error(
        "[LitellmAliasPlugin] Validation failed:",
        result.error.issues,
      );
    }
    return result.success;
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
