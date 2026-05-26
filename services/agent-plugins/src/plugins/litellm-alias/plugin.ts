import type {
  LitellmAliasPluginConfig,
  PluginRouting,
  SystemAgent,
} from "@lite-llm/agents-repository/schemas";
import {
  LITELLM_ALIAS_GLOBAL_FALLBACK_OVERRIDE_DEFAULT,
  LITELLM_ALIAS_INCLUDE_AGENTS_DEFAULT,
  LITELLM_ALIAS_INCLUDE_CATEGORIES_DEFAULT,
  LITELLM_ALIAS_PREFIX_DEFAULT,
  LITELLM_ALIAS_SCHEMA_URL_DEFAULT,
  litellmAliasPluginConfigSchema,
} from "@lite-llm/agents-repository/schemas";
import { sortAliasesByDefinitionOrder } from "@lite-llm/models-service";
import { normalizeAgentMappings } from "../../helpers";
import type {
  CreatePluginOptions,
  PluginDefinition,
  PluginManifest,
} from "../../sdk";
import { generateLitellmAliases } from "./generate";
import { litellmAliasSchema } from "./plugin.schema";

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

export const litellmAliasManifest: PluginManifest<
  "litellm-alias",
  LitellmAliasPluginConfig,
  LitellmAliasOutput
> = {
  id: "litellm-alias",
  displayName: "LiteLLM Router Aliases",
  version: 2,
  output: { fileName: "litellm-aliases.json" },
  capabilities: {
    usesAgents: true,
    usesCategories: true,
    usesModels: true,
  },
  internalAgents: [],
  configSchema: [
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
  ],
  configZodSchema: litellmAliasPluginConfigSchema,
};

export function createLitellmAliasPlugin(
  options: CreatePluginOptions = {},
): PluginDefinition<
  "litellm-alias",
  LitellmAliasPluginConfig,
  LitellmAliasOutput
> {
  return {
    manifest: litellmAliasManifest,
    handlers: {
      build(input): LitellmAliasOutput {
        const aliases: Record<string, string> = {};
        const config: LitellmAliasPluginConfig = input.routing.config ?? {};
        const schemaUrl = config.$schema ?? LITELLM_ALIAS_SCHEMA_URL_DEFAULT;
        const aliasPrefix = config.aliasPrefix ?? LITELLM_ALIAS_PREFIX_DEFAULT;
        const includeAgents =
          config.includeAgents ?? LITELLM_ALIAS_INCLUDE_AGENTS_DEFAULT;
        const includeCategories =
          config.includeCategories ?? LITELLM_ALIAS_INCLUDE_CATEGORIES_DEFAULT;
        const globalFallbackOverride =
          config.globalFallbackOverride ??
          LITELLM_ALIAS_GLOBAL_FALLBACK_OVERRIDE_DEFAULT;
        const rawFallback =
          globalFallbackOverride || input.context.globalFallbackModel;

        const enabledSet = new Set(
          Object.entries(input.context.allModels)
            .filter(([, spec]) => spec.enabled !== false)
            .map(([name]) => name),
        );

        const effectiveFallback =
          rawFallback && enabledSet.has(rawFallback) ? rawFallback : undefined;

        const modelNames: readonly string[] =
          input.context.modelNames ?? DEFAULT_MODEL_NAMES;

        const agentKeys = input.agents.map((a) => (a as AgentWithId).id);
        const categoryKeys = Object.keys(input.context.allCategories ?? {});

        const rawRoutingAgents: Record<string, string | string[]> =
          (input.routing.routing?.agents as Record<
            string,
            string | string[]
          >) ?? {};
        const routingAgents = normalizeAgentMappings(rawRoutingAgents);
        const routingCategories = input.routing.routing?.categories ?? {};
        const hasAgentRouting = Object.keys(routingAgents).length > 0;
        const hasCategoryRouting = Object.keys(routingCategories).length > 0;

        if (includeAgents) {
          for (const agent of input.agents as AgentWithId[]) {
            if (hasAgentRouting && !routingAgents[agent.id]?.length) {
              continue;
            }

            const agentModel =
              agent.model && enabledSet.has(agent.model) ? agent.model : "";
            if (!agentModel) {
              continue;
            }

            const finalKey = aliasPrefix
              ? `${aliasPrefix}${agent.id}`
              : agent.id;
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
          for (const [key, category] of Object.entries(
            input.context.allCategories ?? {},
          )) {
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
      },
      validate(output): boolean {
        const result = litellmAliasSchema.safeParse(output);
        if (!result.success) {
          console.error(
            "[LitellmAliasPlugin] Validation failed:",
            result.error.issues,
          );
        }
        return result.success;
      },
      async afterExport(output): Promise<void> {
        if (!options.aliasDbWriter) return;

        try {
          await options.aliasDbWriter.updateAliases(output.model_group_alias);
        } catch (error) {
          console.error(
            `[LitellmAliasPlugin] Failed to sync aliases to DB: ${error}`,
          );
        }
      },
    },
  };
}

export class LitellmAliasPlugin {
  readonly id = litellmAliasManifest.id;
  readonly name = litellmAliasManifest.displayName;
  readonly version = litellmAliasManifest.version;
  private readonly plugin: ReturnType<typeof createLitellmAliasPlugin>;

  constructor(dbWriter?: AliasDbWriter) {
    this.plugin = createLitellmAliasPlugin({ aliasDbWriter: dbWriter });
  }

  getInternalAgents() {
    return litellmAliasManifest.internalAgents;
  }

  getConfigSchema() {
    return litellmAliasManifest.configSchema;
  }

  getOutputFile(): string {
    return litellmAliasManifest.output.fileName;
  }

  buildOutput(
    agents: SystemAgent[],
    routing: PluginRouting,
    context: Parameters<
      ReturnType<typeof createLitellmAliasPlugin>["handlers"]["build"]
    >[0]["context"],
  ) {
    return this.plugin.handlers.build({ agents, routing, context });
  }

  validate(output: unknown): boolean {
    return (
      this.plugin.handlers.validate?.(output as LitellmAliasOutput) ?? true
    );
  }

  async afterExport(output: unknown): Promise<void> {
    await this.plugin.handlers.afterExport?.(output as LitellmAliasOutput);
  }
}
