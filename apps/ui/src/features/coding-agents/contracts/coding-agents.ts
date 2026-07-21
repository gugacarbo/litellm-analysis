import { z } from "zod";

export const codingAgentDomainErrorSchema = z.object({
  ok: z.literal(false),
  error: z.object({
    code: z.enum(["UNAUTHENTICATED", "FORBIDDEN", "VALIDATION", "INTERNAL"]),
    message: z.string(),
    retryable: z.boolean(),
  }),
});

export type CodingAgentDomainError = z.infer<
  typeof codingAgentDomainErrorSchema
>;
export type CodingAgentResult<T> =
  | { ok: true; data: T }
  | CodingAgentDomainError;

export const codingAgentProviderSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  adapter: z.string().nullable(),
  baseUrl: z.string().nullable(),
  enabledModelCount: z.number().int().nonnegative(),
});

export const codingAgentsOverviewSchema = z.object({
  providers: codingAgentProviderSchema.array(),
  enabledModelCount: z.number().int().nonnegative(),
  publicBaseUrlConfigured: z.boolean(),
});

export const codingAgentArtifactInputSchema = z.object({
  mode: z.enum(["hebo", "providers"]),
});

export const codingAgentArtifactSchema = z.object({
  fileName: z.string(),
  content: z.string(),
  mediaType: z.literal("application/json"),
  modelCount: z.number().int().nonnegative(),
  warnings: z.string().array(),
});

export type CodingAgentProvider = z.infer<typeof codingAgentProviderSchema>;
export type CodingAgentsOverview = z.infer<typeof codingAgentsOverviewSchema>;
export type CodingAgentArtifact = z.infer<typeof codingAgentArtifactSchema>;
