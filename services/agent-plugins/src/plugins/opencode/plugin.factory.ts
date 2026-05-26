import { mergeConfig } from "../../lib/merge-config";
import type { PluginDefinition, PluginRuntimeContext } from "../../sdk";
import type { OpenCodePluginConfig } from "./plugin.config";
import { openCodePluginConfigDefaults } from "./plugin.config";
import { openCodeManifest } from "./plugin.manifest";
import { adaptOpenCodeOutput } from "./plugin.output-adapter";
import { type OpencodeSchemaType, opencodeSchema } from "./plugin.schema";

export type OpenCodeBuildContext = PluginRuntimeContext;

export function createOpenCodePlugin(): PluginDefinition<
  "opencode",
  OpenCodePluginConfig,
  OpencodeSchemaType
> {
  return {
    manifest: openCodeManifest,
    handlers: {
      build(input): OpencodeSchemaType {
        const config = mergeConfig(
          openCodePluginConfigDefaults,
          input.routing.config,
        );
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
