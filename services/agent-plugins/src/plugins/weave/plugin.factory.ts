import type { PluginDefinition, PluginRuntimeContext } from "../../sdk";
import { mergeConfig } from "../../lib/merge-config";
import type { WeavePluginConfig } from "./plugin.config";
import { weavePluginConfigDefaults } from "./plugin.config";
import { weaveManifest } from "./plugin.manifest";
import { adaptWeaveOutput } from "./plugin.output-adapter";
import { type WeaveSchemaType, weaveSchema } from "./plugin.schema";

export type WeaveBuildContext = PluginRuntimeContext;

export function createWeavePlugin(): PluginDefinition<
  "weave",
  WeavePluginConfig,
  WeaveSchemaType
> {
  return {
    manifest: weaveManifest,
    handlers: {
      build(input): WeaveSchemaType {
        const config = mergeConfig(
          weavePluginConfigDefaults,
          input.routing.config,
        );

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
