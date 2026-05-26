import type { PluginDefinition } from "../../sdk";
import type { PluginRouting, SystemAgent } from "../../types";
import {
  type OpenCodePluginConfig,
  openCodePluginConfigSchema,
} from "./plugin.config";
import { openCodeManifest } from "./plugin.manifest";
import { adaptOpenCodeOutput } from "./plugin.output-adapter";
import { type OpencodeSchemaType, opencodeSchema } from "./plugin.schema";

export function createOpenCodePlugin(): PluginDefinition<
  "opencode",
  OpenCodePluginConfig,
  OpencodeSchemaType
> {
  return {
    manifest: openCodeManifest,
    handlers: {
      build(input): OpencodeSchemaType {
        const config = opencodeSchema.parse({
          ...openCodePluginConfigSchema,
          ...(input.routing.config ?? {}),
        });
        const output = adaptOpenCodeOutput({
          agents: input.agents,
          routing: input.routing,
          context: input.context,
          config,
        });

        return opencodeSchema.parse(output);
      },
      validate(output): boolean {
        const result = opencodeSchema.safeParse(output);
        if (!result.success) {
          console.error(
            "[OpenCodePlugin] Validation failed:",
            result.error.issues,
          );
        }
        return result.success;
      },
    },
  };
}

export class OpenCodePlugin {
  readonly id = openCodeManifest.id;
  readonly name = openCodeManifest.displayName;
  readonly version = 1;

  getInternalAgents() {
    return openCodeManifest.internalAgents;
  }

  buildOutput(
    agents: SystemAgent[],
    routing: PluginRouting,
    context: Parameters<
      ReturnType<typeof createOpenCodePlugin>["handlers"]["build"]
    >[0]["context"],
  ) {
    return createOpenCodePlugin().handlers.build({
      agents,
      routing: {
        ...routing,
        config: opencodeSchema.parse({
          ...openCodePluginConfigSchema,
          ...(routing.config ?? {}),
        }),
      },
      context,
    });
  }

  validate(output: unknown): boolean {
    return (
      createOpenCodePlugin().handlers.validate?.(
        output as OpencodeSchemaType,
      ) ?? true
    );
  }

  getOutputFile(): string {
    return openCodeManifest.output.fileName;
  }
}
