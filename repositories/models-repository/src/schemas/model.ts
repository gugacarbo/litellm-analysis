import { z } from "zod";
import { reasoningSchema } from "./thinking";

export const costSchema = z.object({
  input: z
    .number()
    .default(0)
    .meta({ title: "Input Cost", description: "Cost per input token in USD" })
    .optional(),
  output: z
    .number()
    .default(0)
    .meta({ title: "Output Cost", description: "Cost per output token in USD" })
    .optional(),
});

export type Cost = z.infer<typeof costSchema>;

export const pricingSchema = z.object({
  input: z.number().optional(),
  output: z.number().optional(),
});

export type Pricing = z.infer<typeof pricingSchema>;

export const modelSpecSchema = z
  .object({
    enabled: z.boolean().optional().default(true).meta({
      title: "Enabled",
      description: "Whether this model is enabled for routing and selection",
    }),
    displayName: z.string().meta({
      title: "Display Name",
      description: "Human-readable name for the model",
    }),
    family: z
      .string()
      .optional()
      .meta({ title: "Family", description: "Model family" }),
    canonicalSlug: z.string().optional().meta({
      title: "Canonical Slug",
      description: "Stable identifier for the model across providers",
    }),
    description: z.string().optional().meta({
      title: "Description",
      description: "Model description",
    }),
    contextLength: z
      .number()
      .meta({
        title: "Context Length",
        description: "Maximum context window size in tokens",
      })
      .default(200000),
    maxCompletionTokens: z
      .number()
      .meta({
        title: "Max Completion",
        description: "Maximum completion tokens",
      })
      .default(32768),
    knowledgeCutoff: z.string().optional().meta({
      title: "Knowledge Cutoff",
      description: "Training data cutoff date",
    }),
    expirationDate: z.string().optional().meta({
      title: "Expiration Date",
      description: "Date after which the model is deprecated",
    }),
    architecture: z
      .record(z.string(), z.unknown())
      .meta({
        title: "Architecture",
        description: "Model architecture details",
      })
      .nullable()
      .optional(),
    reasoning: reasoningSchema.meta({
      title: "Reasoning",
      description: "Reasoning/thinking runtime configuration for this model",
    }),
    supportedParameters: z
      .record(z.string(), z.unknown())
      .meta({
        title: "Supported Parameters",
        description: "Parameters supported by the model",
      })
      .nullable()
      .optional(),
    defaultParameters: z
      .record(z.string(), z.unknown())
      .meta({
        title: "Default Parameters",
        description: "Default parameter values for the model",
      })
      .nullable()
      .optional(),
    perRequestLimits: z
      .record(z.string(), z.unknown())
      .meta({
        title: "Per-Request Limits",
        description: "Per-request rate limits for the model",
      })
      .nullable()
      .optional(),
    cost: costSchema.optional().meta({
      title: "Cost",
      description:
        "Model pricing in USD per token (matches LiteLLM `input_cost_per_token` / `output_cost_per_token`) — deprecated in favor of pricing",
    }),
    pricing: pricingSchema
      .meta({
        title: "Pricing",
        description:
          "Model pricing structure with input/output per-token costs",
      })
      .nullable()
      .optional(),
  })
  .strict();

export type ModelSpec = z.infer<typeof modelSpecSchema>;
