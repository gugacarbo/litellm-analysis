import { z } from "zod";

export const providerSchema = z
  .object({
    name: z
      .string()
      .meta({ title: "Name", description: "Provider display name" }),
    adapter: z.enum(["openai-compatible"]).optional().meta({
      title: "Adapter",
      description:
        "Upstream API adapter used for real provider calls (not local-proxy)",
    }),
    ownedBy: z.string().optional().meta({
      title: "Owned By",
      description: "Organization that owns this provider",
    }),
    baseUrl: z
      .string()
      .meta({ title: "Base URL", description: "Provider API base URL" }),
    defaultProvider: z.string().default("").meta({
      title: "Default Provider",
      description: "Default provider alias used for models in this provider",
    }),
  })
  .strict();

export type Provider = z.infer<typeof providerSchema>;
