import { z } from "zod";
import { openCodeManifest } from "../manifest/manifest";
import { type OpencodeSchemaType, opencodeSchema } from "../plugin.schema";

export const openCodePluginConfigDefaults: OpencodeSchemaType =
  opencodeSchema.parse({
    $schema: openCodeManifest.$schema,
  });

export type OpenCodePluginConfig = z.input<typeof opencodeSchema>;

export const openCodePluginConfigJsonSchema = z.toJSONSchema(opencodeSchema);
