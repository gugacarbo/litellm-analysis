import { z } from "zod";

export const providerSchema = z
  .object({
    name: z
      .string()
      .meta({ title: "Name", description: "Provider display name" }),
    ownedBy: z.string().meta({
      title: "Owned By",
      description: "Organization that owns this provider",
    }),
    baseUrl: z
      .string()
      .meta({ title: "Base URL", description: "Provider API base URL" }),
    apiKey: z
      .string()
      .meta({ title: "API Key", description: "Provider API key" }),
  })
  .strict();

export type Provider = z.infer<typeof providerSchema>;
