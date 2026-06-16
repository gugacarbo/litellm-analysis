import { mergeConfig } from "../../../lib/merge-config";
import type { CreatePluginOptions, PluginDefinition } from "../../../sdk";
import { adaptModelAliasOutput } from "../adapters/output-adapter";
import type { ModelAliasPluginConfig } from "../config/config";
import { modelAliasPluginConfigDefaults } from "../config/config";
import { modelAliasManifest } from "../manifest/manifest";
import { type ModelAliasSchemaType, modelAliasSchema } from "../schema/schema";

export interface AliasDbWriter {
  updateAliases(aliases: Record<string, string>): Promise<void>;
}

export function createModelAliasPlugin(
  options: CreatePluginOptions = {},
): PluginDefinition<
  "model-alias",
  ModelAliasPluginConfig,
  ModelAliasSchemaType
> {
  return {
    manifest: modelAliasManifest,
    handlers: {
      build(input): ModelAliasSchemaType {
        const config = mergeConfig(
          modelAliasPluginConfigDefaults,
          input.routing.config,
        );
        const output = adaptModelAliasOutput({
          agents: input.agents,
          routing: input.routing,
          context: input.context,
          config,
        });
        return modelAliasSchema.parse(output);
      },
      validate(output): boolean {
        const result = modelAliasSchema.safeParse(output);
        if (!result.success) {
          console.error(
            "[ModelAliasPlugin] Validation failed:",
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
            `[ModelAliasPlugin] Failed to sync aliases to DB: ${error}`,
          );
        }
      },
    },
  };
}
