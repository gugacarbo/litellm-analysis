import { z } from "zod";
import { litellmAliasManifest } from "./plugin.manifest";
import { litellmAliasSchema } from "./plugin.schema";

export const litellmAliasPluginConfigSchema = litellmAliasSchema.parse({
  $schema: litellmAliasManifest.$schema,
  model_group_alias: {},
});

export type LitellmAliasPluginConfig = z.infer<typeof litellmAliasSchema> & {
  [key: string]: unknown;
};

export const litellmAliasPluginConfigJsonSchema =
  z.toJSONSchema(litellmAliasSchema);
