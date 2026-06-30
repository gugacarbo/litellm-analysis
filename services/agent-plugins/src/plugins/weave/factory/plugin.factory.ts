import { mergeConfig } from "../../../lib/merge-config";
import type { PluginDefinition } from "../../../sdk";
import { adaptWeaveOutput } from "../adapters/output-adapter";
import type { WeavePluginConfig } from "../config/config";
import { weavePluginConfigDefaults } from "../config/config";
import { weaveManifest } from "../manifest/manifest";
import { type WeaveSchemaType, weaveSchema } from "../schema/schema";

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
