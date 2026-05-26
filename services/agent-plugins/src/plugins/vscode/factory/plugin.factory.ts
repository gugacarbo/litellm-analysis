import { mergeConfig } from "../../../lib/merge-config";
import type { PluginDefinition, PluginRuntimeContext } from "../../../sdk";
import { adaptVsCodeOutput } from "../adapters/output-adapter";
import type { VsCodePluginConfig } from "../config/config";
import { vsCodePluginConfigDefaults } from "../config/config";
import { vsCodeManifest } from "../manifest/manifest";
import { type VscodeSchemaType, vscodeSchema } from "../schema/schema";

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
