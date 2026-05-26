import { z } from "zod";

export const openCodePluginConfigSchema = z
  .object({
    $schema: z.string().default("https://opencode.ai/config.json").meta({
      title: "Schema URL",
      description: "Official OpenCode config schema URL",
    }),
    defaultModel: z.string().default("").meta({
      title: "Default Model",
      description: "Model to use when a system agent has no model configured",
    }),
    defaultTemperature: z.number().default(0.2).meta({
      title: "Default Temperature",
      description:
        "Default sampling temperature for agents without one configured",
    }),
  })
  .meta({
    title: "OpenCode Config",
    description: "OpenCode AI SDK plugin configuration",
  });

export type OpenCodePluginConfig = z.infer<
  typeof openCodePluginConfigSchema
> & {
  [key: string]: unknown;
};

export const openCodePluginConfigJsonSchema = z.toJSONSchema(
  openCodePluginConfigSchema,
);
