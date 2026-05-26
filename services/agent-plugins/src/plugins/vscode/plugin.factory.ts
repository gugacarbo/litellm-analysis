import { mergeConfig } from "../../lib/merge-config";
import type { PluginDefinition, PluginRuntimeContext } from "../../sdk";
import type { VsCodePluginConfig } from "./plugin.config";
import { vsCodePluginConfigDefaults } from "./plugin.config";
import { vsCodeManifest } from "./plugin.manifest";
import { adaptVsCodeOutput } from "./plugin.output-adapter";
import { type VscodeSchemaType, vscodeSchema } from "./plugin.schema";

export type VsCodeBuildContext = PluginRuntimeContext;

export function createVsCodePlugin(): PluginDefinition<
  "vscode",
  VsCodePluginConfig,
  VscodeSchemaType
> {
  return {
    manifest: vsCodeManifest,
    handlers: {
      build(input): VscodeSchemaType {
        const config = mergeConfig(
          vsCodePluginConfigDefaults,
          input.routing.config,
        );
        const output = adaptVsCodeOutput({
          agents: input.agents,
          routing: input.routing,
          context: input.context,
          config,
        });

        return vscodeSchema.parse(output);
      },
      validate(output): boolean {
        const result = vscodeSchema.safeParse(output);
        if (!result.success) {
          console.error(
            "[VsCodePlugin] Validation failed:",
            result.error.issues,
          );
        }
        return result.success;
      },
    },
  };
}
