import { z } from "zod";
import { litellmAliasManifest } from "./plugin.manifest";
import {
  type LitellmAliasSchemaType,
  litellmAliasSchema,
} from "./plugin.schema";

export const litellmAliasPluginConfigDefaults: LitellmAliasSchemaType =
  litellmAliasSchema.parse({
    $schema: litellmAliasManifest.$schema,
    model_group_alias: {},
  });

export type LitellmAliasPluginConfig = z.input<typeof litellmAliasSchema>;

export const litellmAliasPluginConfigJsonSchema =
  z.toJSONSchema(litellmAliasSchema);
