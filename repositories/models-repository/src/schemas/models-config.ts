import { z } from "zod";
import { modelSpecSchema } from "./model";
import { providerSchema } from "./provider";

export const modelsConfigSchema = z
  .object({
    $schema: z
      .string()
      .default("./models.schema.json")
      .meta({ title: "Schema", description: "JSON Schema reference" })
      .optional(),
    version: z
      .number()
      .default(1)
      .meta({ title: "Version", description: "Config version" }),
    provider: z.record(z.string(), providerSchema).default({}).meta({
      title: "Providers",
      description: "Providers keyed by provider id",
    }),
    models: z
      .record(z.string(), modelSpecSchema)
      .default({})
      .meta({ title: "Models", description: "Model specifications" }),
  })
  .strict();

export type ModelsConfig = z.infer<typeof modelsConfigSchema>;
