import { normalizeAgentMappings } from "../../helpers";
import type { PluginDefinition } from "../../sdk";
import type { PluginRouting, SystemAgent } from "../../types";
import {
  type WeavePluginConfig,
  weavePluginConfigSchema,
} from "./plugin.config";
import { WEAVE_AGENTS, weaveManifest } from "./plugin.manifest";
import { type WeaveSchemaType, weaveSchema } from "./plugin.schema";

const DEFAULT_MODEL_NAMES = ["gpt-5.5", "gpt-5.4"] as const;

function resolveModels(role: string, modelNames: readonly string[]): string[] {
  return modelNames.map((slot) => `${role}/${slot}`);
}

export function createWeavePlugin(): PluginDefinition<
  "weave",
  WeavePluginConfig,
  WeaveSchemaType
> {
  return {
    manifest: weaveManifest,
    handlers: {
      build(input): WeaveSchemaType {
        const incomingConfig = (input.routing.config ??
          {}) as WeavePluginConfig;

        const config = weaveSchema.parse({
          ...weavePluginConfigSchema,
          ...incomingConfig,
          tmux: {
            ...weavePluginConfigSchema.tmux,
            ...(incomingConfig.tmux ?? {}),
          },
          analytics: {
            ...weavePluginConfigSchema.analytics,
            ...(incomingConfig.analytics ?? {}),
          },
          continuation: {
            ...weavePluginConfigSchema.continuation,
            ...(incomingConfig.continuation ?? {}),
            recovery: {
              ...weavePluginConfigSchema.continuation?.recovery,
              ...(incomingConfig.continuation?.recovery ?? {}),
            },
            idle: {
              ...weavePluginConfigSchema.continuation?.idle,
              ...(incomingConfig.continuation?.idle ?? {}),
            },
          },
        });

        const modelNames = input.context.modelNames ?? DEFAULT_MODEL_NAMES;

        const rawAgentMappings: Record<string, string | string[]> =
          (input.routing.routing?.agents as Record<
            string,
            string | string[]
          >) ?? {};
        const agentMappings = normalizeAgentMappings(rawAgentMappings);

        const systemAgentMap = new Map<string, SystemAgent>();
        for (const agent of input.agents) {
          const systemId = agent.id ?? agent.displayName ?? "";
          if (systemId) {
            systemAgentMap.set(systemId, agent);
          }
        }

        const outputAgents: NonNullable<WeaveSchemaType["agents"]> = {};

        for (const weaveAgent of WEAVE_AGENTS) {
          const systemAgentId = agentMappings[weaveAgent.id]?.[0];
          if (!systemAgentId) continue;

          const systemAgent = systemAgentMap.get(systemAgentId);
          if (!systemAgent) continue;

          const model = systemAgent.model ?? "";
          const models = model ? resolveModels(systemAgentId, modelNames) : [];

          outputAgents[weaveAgent.id] = {
            display_name: systemAgent.displayName ?? weaveAgent.displayName,
            model: models[0] ?? model,
            fallback_models: models.slice(1),
            temperature: systemAgent.config?.temperature ?? 0.2,
            color: systemAgent.config?.color ?? "",
            category: weaveAgent.category,
          };
        }

        const outputCategories: NonNullable<WeaveSchemaType["categories"]> = {};
        const categoryRouting = input.routing.routing?.categories ?? {};
        for (const [categoryId, enabled] of Object.entries(categoryRouting)) {
          if (!enabled) continue;

          const systemCat = input.context.allCategories?.[categoryId];
          if (!systemCat) continue;

          const catModel = systemCat.model ?? "";
          const models = catModel ? resolveModels(categoryId, modelNames) : [];

          outputCategories[categoryId] = {
            description: systemCat.description ?? "",
            model: models[0] ?? catModel,
            fallback_models: models.slice(1),
            temperature: systemCat.temperature ?? 0.2,
          };
        }

        return weaveSchema.parse({
          ...config,
          agents: outputAgents,
          categories: outputCategories,
        });
      },
      validate(output): boolean {
        const result = weaveSchema.safeParse(output);
        if (!result.success) {
          console.error(
            "[WeavePlugin] Validation failed:",
            result.error.issues,
          );
        }
        return result.success;
      },
    },
  };
}

export class WeavePlugin {
  readonly id = weaveManifest.id;
  readonly name = weaveManifest.displayName;
  readonly version = weaveManifest.version;

  getInternalAgents() {
    return weaveManifest.internalAgents;
  }

  buildOutput(
    agents: SystemAgent[],
    routing: PluginRouting,
    context: Parameters<
      ReturnType<typeof createWeavePlugin>["handlers"]["build"]
    >[0]["context"],
  ) {
    const incomingConfig = (routing.config ?? {}) as WeavePluginConfig;
    return createWeavePlugin().handlers.build({
      agents,
      routing: {
        ...routing,
        config: weaveSchema.parse({
          ...weavePluginConfigSchema,
          ...incomingConfig,
          tmux: {
            ...weavePluginConfigSchema.tmux,
            ...(incomingConfig.tmux ?? {}),
          },
          analytics: {
            ...weavePluginConfigSchema.analytics,
            ...(incomingConfig.analytics ?? {}),
          },
          continuation: {
            ...weavePluginConfigSchema.continuation,
            ...(incomingConfig.continuation ?? {}),
            recovery: {
              ...weavePluginConfigSchema.continuation?.recovery,
              ...(incomingConfig.continuation?.recovery ?? {}),
            },
            idle: {
              ...weavePluginConfigSchema.continuation?.idle,
              ...(incomingConfig.continuation?.idle ?? {}),
            },
          },
        }),
      },
      context,
    });
  }

  validate(output: unknown): boolean {
    return (
      createWeavePlugin().handlers.validate?.(output as WeaveSchemaType) ?? true
    );
  }

  getOutputFile(): string {
    return weaveManifest.output.fileName;
  }
}
