import { z } from "zod";
import { modelAliasManifest } from "../manifest/manifest";
import {
  type ModelAliasSchemaType,
  modelAliasSchema,
} from "../schema/schema";

export const modelAliasPluginConfigDefaults: ModelAliasSchemaType =
  modelAliasSchema.parse({
    $schema: modelAliasManifest.$schema,
    model_group_alias: {},
  });

export type ModelAliasPluginConfig = z.input<typeof modelAliasSchema>;

export const modelAliasPluginConfigJsonSchema =
  z.toJSONSchema(modelAliasSchema);
