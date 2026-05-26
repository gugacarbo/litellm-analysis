import type { CreatePluginOptions, PluginDefinition } from "../../sdk";
import { mergeConfig } from "../../lib/merge-config";
import type { LitellmAliasPluginConfig } from "./plugin.config";
import { litellmAliasPluginConfigDefaults } from "./plugin.config";
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
        const config = mergeConfig(
          litellmAliasPluginConfigDefaults,
          input.routing.config,
        );
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
