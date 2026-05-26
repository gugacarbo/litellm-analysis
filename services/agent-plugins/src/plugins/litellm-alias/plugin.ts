import { sortAliasesByDefinitionOrder } from "@lite-llm/models-service";
import { normalizeAgentMappings } from "../../helpers";
import type { CreatePluginOptions, PluginDefinition } from "../../sdk";
import type { PluginRouting, SystemAgent } from "../../types";
import { generateLitellmAliases } from "./generate";
import {
  type LitellmAliasPluginConfig,
  litellmAliasPluginConfigSchema,
} from "./plugin.config";
import { litellmAliasManifest } from "./plugin.manifest";
import {
  type LitellmAliasSchemaType,
  litellmAliasSchema,
} from "./plugin.schema";

/** Logical slot names for primary + fallback aliases (default: gpt-5.5..gpt-5.1). */
export const DEFAULT_MODEL_NAMES = ["gpt-5.5", "gpt-5.4"] as const;

export interface AliasDbWriter {
  updateAliases(aliases: Record<string, string>): Promise<void>;
}

type AgentWithId = SystemAgent & { id: string };

export function createLitellmAliasPlugin(
  options: CreatePluginOptions = {},
): PluginDefinition<
  "litellm-alias",
  LitellmAliasPluginConfig,
  LitellmAliasSchemaType
> {
  return {
    manifest: litellmAliasManifest,
    handlers: {
      build(input): LitellmAliasSchemaType {
        const aliases: Record<string, string> = {};
        const config = litellmAliasSchema.parse({
          ...litellmAliasPluginConfigSchema,
          ...(input.routing.config ?? {}),
        });
        const rawFallback = input.context.globalFallbackModel;

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

        for (const agent of input.agents as AgentWithId[]) {
          if (hasAgentRouting && !routingAgents[agent.id]?.length) {
            continue;
          }

          const agentModel =
            agent.model && enabledSet.has(agent.model) ? agent.model : "";
          if (!agentModel) {
            continue;
          }

          Object.assign(
            aliases,
            generateLitellmAliases(
              agent.id,
              agentModel,
              effectiveFallback,
              modelNames,
            ),
          );
        }

        for (const [key, category] of Object.entries(
          input.context.allCategories ?? {},
        )) {
          if (hasCategoryRouting && !routingCategories[key]) {
            continue;
          }

          if (!(category.model && enabledSet.has(category.model))) {
            continue;
          }

          Object.assign(
            aliases,
            generateLitellmAliases(
              key,
              category.model && enabledSet.has(category.model)
                ? category.model
                : "",
              effectiveFallback,
              modelNames,
            ),
          );
        }

        return litellmAliasSchema.parse({
          $schema: config.$schema,
          model_group_alias: sortAliasesByDefinitionOrder(
            aliases,
            agentKeys,
            categoryKeys,
          ),
        });
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
    return this.plugin.handlers.build({
      agents,
      routing: {
        ...routing,
        config: litellmAliasSchema.parse({
          ...litellmAliasPluginConfigSchema,
          ...(routing.config ?? {}),
        }),
      },
      context,
    });
  }

  validate(output: unknown): boolean {
    return (
      this.plugin.handlers.validate?.(output as LitellmAliasSchemaType) ?? true
    );
  }

  async afterExport(output: unknown): Promise<void> {
    await this.plugin.handlers.afterExport?.(output as LitellmAliasSchemaType);
  }
}
