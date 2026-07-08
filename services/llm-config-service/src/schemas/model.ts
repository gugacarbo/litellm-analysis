import { z } from "zod";
import { ReasoningSchema } from "./thinking.js";

const PricingSchema = z.object({
  request: z.string().optional(),
  image: z.string().optional(),
  input: z.string().optional(),
  output: z.string().optional(),
  input_cache_read: z.string().optional(),
  input_cache_write: z.string().optional(),
  web_search: z.string().optional(),
  internal_reasoning: z.string().optional(),
});

export type Pricing = z.infer<typeof PricingSchema>;

const CostSchema = z.object({
  request: z.string().optional(),
  image: z.string().optional(),
  prompt: z.string().optional(),
  completion: z.string().optional(),
  input: z.string().optional(),
  output: z.string().optional(),
});

const CostInputSchema = z.object({
  input: z.number().optional(),
  output: z.number().optional(),
});

const SupportedParametersSchema = z.record(z.string(), z.unknown()).nullable().optional();

const DefaultParametersSchema = z.record(z.string(), z.unknown()).nullable().optional();

const PerRequestLimitsSchema = z.record(z.string(), z.unknown()).nullable().optional();

export type SupportedParameters = z.infer<typeof SupportedParametersSchema>;
export type DefaultParameters = z.infer<typeof DefaultParametersSchema>;
export type PerRequestLimits = z.infer<typeof PerRequestLimitsSchema>;
export type Architecture = z.infer<typeof SupportedParametersSchema>;

export const ModelConfigSchema = z
  .object({
    name: z.string(),
    provider: z.string(),
    displayName: z.string().optional(),
    family: z.string().optional(),
    canonicalSlug: z.string().optional(),
    description: z.string().optional(),
    contextLength: z.number().optional(),
    maxCompletionTokens: z.number().optional(),
    knowledgeCutoff: z.string().optional(),
    expirationDate: z.string().optional(),
    cost: CostSchema.optional(),
    pricing: PricingSchema.optional(),
    cost_input: CostInputSchema.optional(),
    architecture: z.record(z.string(), z.unknown()).optional(),
    reasoning: ReasoningSchema.optional(),
    supportedParameters: SupportedParametersSchema,
    defaultParameters: DefaultParametersSchema,
    perRequestLimits: PerRequestLimitsSchema,
    requestOptions: z.unknown().optional(),
  })
  .passthrough();

export type ModelConfig = z.input<typeof ModelConfigSchema>;
