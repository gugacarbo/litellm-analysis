import type { PluginDefinition } from "../../sdk";
import type { PluginRouting, SystemAgent } from "../../types";
import {
  type OpenAgentPluginConfig,
  openAgentPluginConfigSchema,
} from "./plugin.config";
import { openAgentManifest } from "./plugin.manifest";
import { adaptOpenAgentOutput } from "./plugin.output-adapter";
import { type OpenagentSchemaType, openagentSchema } from "./plugin.schema";

export function createOpenAgentPlugin(): PluginDefinition<
  "openagent",
  OpenAgentPluginConfig,
  OpenagentSchemaType
> {
  return {
    manifest: openAgentManifest,
    handlers: {
      build(input): OpenagentSchemaType {
        const config = openagentSchema.parse({
          ...openAgentPluginConfigSchema,
          ...(input.routing.config ?? {}),
        });

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

export class OpenAgentPlugin {
  readonly id = openAgentManifest.id;
  readonly name = openAgentManifest.displayName;
  readonly version = 1;

  getInternalAgents() {
    return openAgentManifest.internalAgents;
  }

  buildOutput(
    agents: SystemAgent[],
    routing: PluginRouting,
    context: Parameters<
      ReturnType<typeof createOpenAgentPlugin>["handlers"]["build"]
    >[0]["context"],
  ) {
    return createOpenAgentPlugin().handlers.build({
      agents,
      routing: {
        ...routing,
        config: openagentSchema.parse({
          ...openAgentPluginConfigSchema,
          ...(routing.config ?? {}),
        }),
      },
      context,
    });
  }

  validate(output: unknown): boolean {
    return (
      createOpenAgentPlugin().handlers.validate?.(
        output as OpenagentSchemaType,
      ) ?? true
    );
  }

  getOutputFile(): string {
    return openAgentManifest.output.fileName;
  }
}
