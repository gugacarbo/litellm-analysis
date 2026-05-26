import type { PluginDefinition } from "../../sdk";
import type { PluginRouting, SystemAgent } from "../../types";
import {
  type WeavePluginConfig,
  weavePluginConfigSchema,
} from "./plugin.config";
import { weaveManifest } from "./plugin.manifest";
import { adaptWeaveOutput } from "./plugin.output-adapter";
import { type WeaveSchemaType, weaveSchema } from "./plugin.schema";

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

        const output = adaptWeaveOutput({
          agents: input.agents,
          routing: input.routing,
          context: input.context,
          config,
        });
        return weaveSchema.parse(output);
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
