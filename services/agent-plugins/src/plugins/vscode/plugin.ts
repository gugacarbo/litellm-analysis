import type { PluginDefinition } from "../../sdk";
import type { PluginRouting, SystemAgent } from "../../types";
import {
  type VsCodePluginConfig,
  vsCodePluginConfigSchema,
} from "./plugin.config";
import { vsCodeManifest } from "./plugin.manifest";
import { adaptVsCodeOutput } from "./plugin.output-adapter";
import { type VscodeSchemaType, vscodeSchema } from "./plugin.schema";

export function createVsCodePlugin(): PluginDefinition<
  "vscode",
  VsCodePluginConfig,
  VscodeSchemaType
> {
  return {
    manifest: vsCodeManifest,
    handlers: {
      build(input): VscodeSchemaType {
        const config = vscodeSchema.parse({
          ...vsCodePluginConfigSchema,
          ...(input.routing.config ?? {}),
        });
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

export class VsCodePlugin {
  readonly id = vsCodeManifest.id;
  readonly name = vsCodeManifest.displayName;
  readonly version = 1;

  getInternalAgents() {
    return vsCodeManifest.internalAgents;
  }

  buildOutput(
    agents: SystemAgent[],
    routing: PluginRouting,
    context: Parameters<
      ReturnType<typeof createVsCodePlugin>["handlers"]["build"]
    >[0]["context"],
  ) {
    return createVsCodePlugin().handlers.build({
      agents,
      routing: {
        ...routing,
        config: vscodeSchema.parse({
          ...vsCodePluginConfigSchema,
          ...(routing.config ?? {}),
        }),
      },
      context,
    });
  }

  validate(output: unknown): boolean {
    return (
      createVsCodePlugin().handlers.validate?.(output as VscodeSchemaType) ??
      true
    );
  }

  getOutputFile(): string {
    return vsCodeManifest.output.fileName;
  }
}
