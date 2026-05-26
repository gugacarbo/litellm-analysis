import type { CreatePluginOptions, PluginDefinition } from "../../sdk";
import type { PluginRouting, SystemAgent } from "../../types";
import {
  type LitellmAliasPluginConfig,
  litellmAliasPluginConfigSchema,
} from "./plugin.config";
import { litellmAliasManifest } from "./plugin.manifest";
import { adaptLitellmAliasOutput } from "./plugin.output-adapter";
import {
  type LitellmAliasSchemaType,
  litellmAliasSchema,
} from "./plugin.schema";

export interface AliasDbWriter {
  updateAliases(aliases: Record<string, string>): Promise<void>;
}

export function createLitellmAliasPlugin(
  options: CreatePluginOptions = {},
): PluginDefinition<
  "litellm-alias",
  LitellmAliasPluginConfig,
  LitellmAliasSchemaType
> {
  return {
    manifest: litellmAliasManifest,
    handlers: {
      build(input): LitellmAliasSchemaType {
        const config = litellmAliasSchema.parse({
          ...litellmAliasPluginConfigSchema,
          ...(input.routing.config ?? {}),
        });
        const output = adaptLitellmAliasOutput({
          agents: input.agents,
          routing: input.routing,
          context: input.context,
          config,
        });
        return litellmAliasSchema.parse(output);
      },
      validate(output): boolean {
        const result = litellmAliasSchema.safeParse(output);
        if (!result.success) {
          console.error(
            "[LitellmAliasPlugin] Validation failed:",
            result.error.issues,
          );
        }
        return result.success;
      },
      async afterExport(output): Promise<void> {
        if (!options.aliasDbWriter) return;

        try {
          await options.aliasDbWriter.updateAliases(output.model_group_alias);
        } catch (error) {
          console.error(
            `[LitellmAliasPlugin] Failed to sync aliases to DB: ${error}`,
          );
        }
      },
    },
  };
}

export class LitellmAliasPlugin {
  readonly id = litellmAliasManifest.id;
  readonly name = litellmAliasManifest.displayName;
  readonly version = litellmAliasManifest.version;
  private readonly plugin: ReturnType<typeof createLitellmAliasPlugin>;

  constructor(dbWriter?: AliasDbWriter) {
    this.plugin = createLitellmAliasPlugin({ aliasDbWriter: dbWriter });
  }

  getInternalAgents() {
    return litellmAliasManifest.internalAgents;
  }

  getOutputFile(): string {
    return litellmAliasManifest.output.fileName;
  }

  buildOutput(
    agents: SystemAgent[],
    routing: PluginRouting,
    context: Parameters<
      ReturnType<typeof createLitellmAliasPlugin>["handlers"]["build"]
    >[0]["context"],
  ) {
    return this.plugin.handlers.build({
      agents,
      routing: {
        ...routing,
        config: litellmAliasSchema.parse({
          ...litellmAliasPluginConfigSchema,
          ...(routing.config ?? {}),
        }),
      },
      context,
    });
  }

  validate(output: unknown): boolean {
    return (
      this.plugin.handlers.validate?.(output as LitellmAliasSchemaType) ?? true
    );
  }

  async afterExport(output: unknown): Promise<void> {
    await this.plugin.handlers.afterExport?.(output as LitellmAliasSchemaType);
  }
}
