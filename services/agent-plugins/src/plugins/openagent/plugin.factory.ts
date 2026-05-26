import { mergeConfig } from "../../lib/merge-config";
import type { PluginDefinition, PluginRuntimeContext } from "../../sdk";
import type { OpenAgentPluginConfig } from "./plugin.config";
import { openAgentPluginConfigDefaults } from "./plugin.config";
import { openAgentManifest } from "./plugin.manifest";
import { adaptOpenAgentOutput } from "./plugin.output-adapter";
import { type OpenagentSchemaType, openagentSchema } from "./plugin.schema";

export type OpenAgentBuildContext = PluginRuntimeContext;

export function createOpenAgentPlugin(): PluginDefinition<
  "openagent",
  OpenAgentPluginConfig,
  OpenagentSchemaType
> {
  return {
    manifest: openAgentManifest,
    handlers: {
      build(input): OpenagentSchemaType {
        const config = mergeConfig(
          openAgentPluginConfigDefaults,
          input.routing.config,
        );

        const output = adaptOpenAgentOutput({
          agents: input.agents,
          routing: input.routing,
          context: input.context,
          config,
        });

        return openagentSchema.parse(output);
      },
      validate(output): boolean {
        const result = openagentSchema.safeParse(output);
        if (!result.success) {
          console.error(
            "[OpenAgentPlugin] Validation failed:",
            result.error.issues,
          );
        }
        return result.success;
      },
    },
  };
}
