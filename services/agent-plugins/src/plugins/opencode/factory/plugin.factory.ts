import { mergeConfig } from "../../../lib/merge-config";
import type { PluginDefinition, PluginRuntimeContext } from "../../../sdk";
import { adaptOpenCodeOutput } from "../adapters/output-adapter";
import type { OpenCodePluginConfig } from "../config/config";
import { openCodePluginConfigDefaults } from "../config/config";
import { openCodeManifest } from "../manifest/manifest";
import { type OpencodeSchemaType, opencodeSchema } from "../plugin.schema";

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
