import { z } from "zod";

export const domainErrorCodeSchema = z.enum([
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "VALIDATION",
  "NOT_FOUND",
  "CONFLICT",
  "DESTINATION_BLOCKED",
  "UPSTREAM_UNAVAILABLE",
  "TIMEOUT",
  "RATE_LIMITED",
  "INTERNAL",
]);

export const domainErrorSchema = z.object({
  ok: z.literal(false),
  error: z.object({
    code: domainErrorCodeSchema,
    message: z.string(),
    retryable: z.boolean(),
    fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
    currentRevision: z.number().int().positive().optional(),
    dependentModelCount: z.number().int().nonnegative().optional(),
  }),
});

export type DomainError = z.infer<typeof domainErrorSchema>;

export const resultSchema = <T extends z.ZodType>(data: T) =>
  z.union([z.object({ ok: z.literal(true), data }), domainErrorSchema]);

export type Result<T> = { ok: true; data: T } | DomainError;

export const emptyInputSchema = z.object({});

export const applicationSecretKeySchema = z.enum([
  "artificial_analysis_api_key",
  "openrouter_api_key",
]);

export type ApplicationSecretKey = z.infer<typeof applicationSecretKeySchema>;

export const applicationSecretPublicSchema = z
  .object({
    key: applicationSecretKeySchema,
    isConfigured: z.boolean(),
    createdAt: z.date().nullable(),
    updatedAt: z.date().nullable(),
  })
  .strict();

export type ApplicationSecretPublic = z.infer<
  typeof applicationSecretPublicSchema
>;

export const replaceApplicationSecretInputSchema = z.object({
  key: applicationSecretKeySchema,
  value: z.string().trim().min(1, "API key is required."),
});

export const removeApplicationSecretInputSchema = z.object({
  key: applicationSecretKeySchema,
});

export type ReplaceApplicationSecretInput = z.infer<
  typeof replaceApplicationSecretInputSchema
>;

export type RemoveApplicationSecretInput = z.infer<
  typeof removeApplicationSecretInputSchema
>;

const uuidSchema = z.uuid();
const revisionSchema = z.number().int().positive();
const nullableText = z.string().nullable().optional();
const architectureSchema = z
  .object({
    inputModalities: z
      .array(z.enum(["text", "image", "audio", "file"]))
      .optional(),
    outputModalities: z.array(z.enum(["text", "image", "audio"])).optional(),
    tokenizer: z.string().optional(),
    instructType: z.string().optional(),
  })
  .nullable()
  .optional();
const reasoningSchema = z
  .object({
    effort: z.enum(["low", "medium", "high", "xhigh"]).optional(),
    maxTokens: z.number().int().positive().optional(),
    supportsToolUse: z.boolean().optional(),
    supportsVision: z.boolean().optional(),
    supportsComputerUse: z.boolean().optional(),
  })
  .nullable()
  .optional();
const supportedParametersSchema = z
  .array(
    z.enum([
      "max_tokens",
      "temperature",
      "top_p",
      "top_k",
      "frequency_penalty",
      "presence_penalty",
      "repetition_penalty",
      "seed",
      "stop",
      "tools",
      "tool_choice",
      "response_format",
      "structured_output",
      "reasoning",
      "logprobs",
      "top_logprobs",
    ]),
  )
  .nullable()
  .optional();
const defaultParametersSchema = z
  .object({
    temperature: z.number().min(0).max(2).optional(),
    topP: z.number().min(0).max(1).optional(),
    topK: z.number().int().positive().optional(),
    maxTokens: z.number().int().positive().optional(),
    frequencyPenalty: z.number().min(-2).max(2).optional(),
    presencePenalty: z.number().min(-2).max(2).optional(),
    repetitionPenalty: z.number().min(0).max(2).optional(),
    seed: z.number().int().optional(),
    stop: z.array(z.string()).optional(),
  })
  .nullable()
  .optional();
const perRequestLimitsSchema = z
  .object({
    maxInputTokens: z.number().int().positive().optional(),
    maxOutputTokens: z.number().int().positive().optional(),
    rpm: z.number().int().positive().optional(),
    tpm: z.number().int().positive().optional(),
  })
  .nullable()
  .optional();
const pricingSchema = z
  .object({
    input: z.number().min(0).optional(),
    output: z.number().min(0).optional(),
    cacheRead: z.number().min(0).optional(),
    image: z.number().min(0).optional(),
  })
  .nullable()
  .optional();
const requestOptionsSchema = z
  .object({
    timeoutMs: z.number().int().positive().optional(),
    maxRetries: z.number().int().min(0).max(10).optional(),
    headers: z.record(z.string(), z.string()).optional(),
  })
  .nullable()
  .optional();

export const modelSettingsInputSchema = z.object({
  displayName: nullableText,
  family: nullableText,
  canonicalSlug: nullableText,
  description: nullableText,
  contextLength: z.number().int().nonnegative().nullable().optional(),
  maxCompletionTokens: z.number().int().nonnegative().nullable().optional(),
  knowledgeCutoff: nullableText,
  expirationDate: nullableText,
  architecture: architectureSchema,
  reasoning: reasoningSchema,
  supportedParameters: supportedParametersSchema,
  defaultParameters: defaultParametersSchema,
  perRequestLimits: perRequestLimitsSchema,
  pricing: pricingSchema,
  requestOptions: requestOptionsSchema,
  reasoningApiId: uuidSchema.nullable().optional(),
});

export const saveModelInputSchema = modelSettingsInputSchema.extend({
  id: uuidSchema.optional(),
  providerId: uuidSchema,
  modelId: z.string().trim().min(1),
  enabled: z.boolean().optional(),
  aliases: z.array(z.string().trim().min(1)).optional(),
  expectedRevision: revisionSchema.optional(),
});

export const toggleModelInputSchema = z.object({
  id: uuidSchema,
  expectedRevision: revisionSchema,
  enabled: z.boolean(),
});

export const deleteByRevisionInputSchema = z.object({
  id: uuidSchema,
  expectedRevision: revisionSchema,
});

export const idInputSchema = z.object({ id: uuidSchema });

export const credentialCommandSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("preserve") }),
  z.object({ kind: z.literal("replace"), value: z.string().trim().min(1) }),
  z.object({ kind: z.literal("remove") }),
]);

const createCredentialCommandSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("replace"), value: z.string().trim().min(1) }),
  z.object({ kind: z.literal("remove") }),
]);

const providerBaseUrlSchema = z
  .string()
  .trim()
  .url()
  .refine((value) => {
    const url = new URL(value);
    return !url.username && !url.password && !url.search && !url.hash;
  }, "baseUrl must not include userinfo, query, or fragment");

export const createProviderInputSchema = z.object({
  name: z.string().trim().min(1),
  provider: z.string().trim().min(1),
  baseUrl: providerBaseUrlSchema.nullable().optional(),
  isDefault: z.boolean().optional(),
  credential: createCredentialCommandSchema.optional(),
});

export const updateProviderInputSchema = z.object({
  id: uuidSchema,
  expectedRevision: revisionSchema,
  name: z.string().trim().min(1).optional(),
  provider: z.string().trim().min(1).optional(),
  baseUrl: providerBaseUrlSchema.nullable().optional(),
  credential: credentialCommandSchema.optional(),
});

export const setDefaultProviderInputSchema = z.object({
  id: uuidSchema,
  expectedRevision: revisionSchema,
});

export const updateAliasInputSchema = z.object({
  id: uuidSchema,
  expectedRevision: revisionSchema,
  alias: z.string().trim().min(1),
  targetModelId: uuidSchema,
});

export const discoverModelsInputSchema = z.object({ providerId: uuidSchema });

export const applyDiscoverySelectionInputSchema = z.object({
  providerId: uuidSchema,
  items: z.array(
    z.object({
      modelId: z.string().trim().min(1),
      displayName: z.string().trim().min(1).nullable().optional(),
      enabled: z.boolean().optional(),
      expectedRevision: revisionSchema.optional(),
    }),
  ),
});

export const probeModelInputSchema = z.object({
  providerId: uuidSchema,
  modelId: z.string().trim().min(1),
  prompt: z
    .string()
    .trim()
    .min(1)
    .refine((value) => [...value].length <= 1024, {
      message: "prompt must not exceed 1024 characters",
    }),
});

const timestampSchema = z.date();

export const aliasPublicSchema = z
  .object({
    id: uuidSchema,
    alias: z.string(),
    aliasNormalized: z.string(),
    targetModelId: uuidSchema,
    revision: revisionSchema,
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
  })
  .strict();

export const modelSummarySchema = modelSettingsInputSchema
  .extend({
    id: uuidSchema,
    providerId: uuidSchema,
    providerName: z.string(),
    modelId: z.string(),
    enabled: z.boolean(),
    revision: revisionSchema,
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
  })
  .strict();

export const modelDetailSchema = modelSummarySchema
  .extend({ aliases: z.array(aliasPublicSchema) })
  .strict();

export const providerPublicSchema = z
  .object({
    id: uuidSchema,
    name: z.string(),
    provider: z.string().nullable(),
    baseUrl: providerBaseUrlSchema.nullable(),
    isDefault: z.boolean(),
    hasStoredSecret: z.boolean(),
    credentialStatus: z.enum(["configured", "missing"]),
    modelCount: z.number().int().nonnegative(),
    revision: revisionSchema,
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
  })
  .strict();

export type ProviderPublic = z.infer<typeof providerPublicSchema>;

/** Unsafe persisted URLs are never allowed to cross the server boundary. */
export function redactProviderBaseUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const parsed = providerBaseUrlSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function toProviderPublicDto(value: unknown) {
  const raw = z.object({ baseUrl: z.unknown() }).passthrough().parse(value);
  return providerPublicSchema.parse({
    ...raw,
    baseUrl: redactProviderBaseUrl(raw.baseUrl),
  });
}

export const discoveredModelSchema = z
  .object({
    modelId: z.string(),
    displayName: z.string().nullable(),
    status: z.enum(["new", "changed", "unchanged", "conflict"]),
    currentRevision: revisionSchema.optional(),
  })
  .strict();

export const discoveryResultSchema = z
  .object({ models: z.array(discoveredModelSchema) })
  .strict();

export const discoveryApplyResultSchema = z
  .object({
    modelId: z.string(),
    status: z.enum(["created", "updated", "unchanged", "conflict"]),
    currentRevision: revisionSchema.optional(),
  })
  .strict();

export const probeModelResultSchema = z
  .object({ modelId: z.string(), content: z.string(), truncated: z.boolean() })
  .strict();

export const mutationSuccessSchema = z
  .object({ deleted: z.literal(true) })
  .strict();

export type SaveModelInput = z.infer<typeof saveModelInputSchema>;
export type ToggleModelInput = z.infer<typeof toggleModelInputSchema>;
export type DeleteByRevisionInput = z.infer<typeof deleteByRevisionInputSchema>;
export type CreateProviderInput = z.infer<typeof createProviderInputSchema>;
export type UpdateProviderInput = z.infer<typeof updateProviderInputSchema>;
export type UpdateAliasInput = z.infer<typeof updateAliasInputSchema>;
export type ApplyDiscoverySelectionInput = z.infer<
  typeof applyDiscoverySelectionInputSchema
>;
export type ProbeModelInput = z.infer<typeof probeModelInputSchema>;
