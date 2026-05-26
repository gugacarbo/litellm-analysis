import { z } from "zod";
import { openCodeManifest } from "./plugin.manifest";
import { opencodeSchema } from "./plugin.schema";

export const openCodePluginConfigSchema = opencodeSchema.parse({
  $schema: openCodeManifest.$schema,
});

export type OpenCodePluginConfig = z.infer<typeof opencodeSchema> & {
  [key: string]: unknown;
};

export const openCodePluginConfigJsonSchema = z.toJSONSchema(opencodeSchema);
