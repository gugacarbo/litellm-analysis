import type {
  LitellmAliasPluginConfig,
  SystemAgent,
} from "@lite-llm/agents-repository/schemas";
import {
  LITELLM_ALIAS_GLOBAL_FALLBACK_OVERRIDE_DEFAULT,
  LITELLM_ALIAS_INCLUDE_AGENTS_DEFAULT,
  LITELLM_ALIAS_INCLUDE_CATEGORIES_DEFAULT,
  LITELLM_ALIAS_PREFIX_DEFAULT,
  LITELLM_ALIAS_SCHEMA_URL_DEFAULT,
} from "@lite-llm/agents-repository/schemas";
import { sortAliasesByDefinitionOrder } from "@lite-llm/models-service";
import type { IPlugin, TransformContext, TypedPluginRouting } from "../plugin";
import { normalizeAgentMappings } from "../plugin";
import type {
  ConfigField,
  InternalAgent,
  PluginConfigFor,
} from "../plugin-types";
import { generateLitellmAliases } from "./generate";
import { litellmAliasSchema } from "./schemas/generated/litellm-alias.zod";

/** Logical slot names for primary + fallback aliases (default: gpt-5.5..gpt-5.1). */
export const DEFAULT_MODEL_NAMES = ["gpt-5.5", "gpt-5.4"] as const;

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
        default: LITELLM_ALIAS_PREFIX_DEFAULT,
        placeholder: "e.g. prod:",
        description: "Text prepended to all generated alias names",
      },
      {
        key: "includeAgents",
        type: "boolean",
        label: "Include Agents",
        required: false,
        default: LITELLM_ALIAS_INCLUDE_AGENTS_DEFAULT,
        description: "Include agent-based aliases in output",
      },
      {
        key: "includeCategories",
        type: "boolean",
        label: "Include Categories",
        required: false,
        default: LITELLM_ALIAS_INCLUDE_CATEGORIES_DEFAULT,
        description: "Include category-based aliases in output",
      },
      {
        key: "globalFallbackOverride",
        type: "string",
        label: "Global Fallback Override",
        required: false,
        default: LITELLM_ALIAS_GLOBAL_FALLBACK_OVERRIDE_DEFAULT,
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
    const schemaUrl = config.$schema ?? LITELLM_ALIAS_SCHEMA_URL_DEFAULT;
    const aliasPrefix = config.aliasPrefix ?? LITELLM_ALIAS_PREFIX_DEFAULT;
    const includeAgents =
      config.includeAgents ?? LITELLM_ALIAS_INCLUDE_AGENTS_DEFAULT;
    const includeCategories =
      config.includeCategories ?? LITELLM_ALIAS_INCLUDE_CATEGORIES_DEFAULT;
    const globalFallbackOverride =
      config.globalFallbackOverride ??
      LITELLM_ALIAS_GLOBAL_FALLBACK_OVERRIDE_DEFAULT;
    const rawFallback = globalFallbackOverride || ctx.globalFallbackModel;

    // Build set of enabled model names
    const enabledSet = new Set(
      Object.entries(ctx.allModels)
        .filter(([, spec]) => spec.enabled !== false)
        .map(([name]) => name),
    );

    const effectiveFallback =
      rawFallback && enabledSet.has(rawFallback) ? rawFallback : undefined;

    // Model slot names from plugin context, fallback to DEFAULT_MODEL_NAMES.
    const modelNames: readonly string[] = ctx.modelNames ?? DEFAULT_MODEL_NAMES;

    // Agent/category keys in definition order (from plugin context).
    const agentKeys = agents.map((a) => (a as AgentWithId).id);
    const categoryKeys = Object.keys(ctx.allCategories ?? {});

    // Read routing mappings (empty object = all enabled)
    const rawRoutingAgents: Record<string, string | string[]> =
      (_routing.routing?.agents as Record<string, string | string[]>) ?? {};
    const routingAgents = normalizeAgentMappings(rawRoutingAgents);
    const routingCategories = _routing.routing?.categories ?? {};
    const hasAgentRouting = Object.keys(routingAgents).length > 0;
    const hasCategoryRouting = Object.keys(routingCategories).length > 0;

    if (includeAgents) {
      for (const agent of agents as AgentWithId[]) {
        // Filter by routing.agents when present (empty routing = all enabled)
        if (hasAgentRouting && !routingAgents[agent.id]?.length) {
          continue;
        }

        const agentModel =
          agent.model && enabledSet.has(agent.model) ? agent.model : "";
        if (!agentModel) {
          continue;
        }

        const finalKey = aliasPrefix ? `${aliasPrefix}${agent.id}` : agent.id;
        Object.assign(
          aliases,
          generateLitellmAliases(
            finalKey,
            agentModel,
            effectiveFallback,
            modelNames,
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

        if (!(category.model && enabledSet.has(category.model))) {
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
            effectiveFallback,
            modelNames,
          ),
        );
      }
    }

    return {
      $schema: schemaUrl,
      model_group_alias: sortAliasesByDefinitionOrder(
        aliases,
        agentKeys,
        categoryKeys,
      ),
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
