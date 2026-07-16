import { z } from "zod";

// ── Architecture (OpenRouter-aligned) ──────────────────────────────────────

export const architectureSchema = z.object({
  inputModalities: z
    .array(z.enum(["text", "image", "audio", "file"]))
    .optional(),
  outputModalities: z.array(z.enum(["text", "image", "audio"])).optional(),
  tokenizer: z.string().optional(),
  instructType: z.string().optional(),
});

export type Architecture = z.infer<typeof architectureSchema>;

// ── Reasoning (replaces thinking + metadata.reasoning) ────────────────────

export const reasoningSchema = z.object({
  effort: z.enum(["low", "medium", "high", "xhigh"]).optional(),
  maxTokens: z.number().int().positive().optional(),
  supportsToolUse: z.boolean().optional(),
  supportsComputerUse: z.boolean().optional(),
});

export type Reasoning = z.infer<typeof reasoningSchema>;

// ── Supported Parameters ──────────────────────────────────────────────────

export const supportedParametersSchema = z.array(
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
);

export type SupportedParameters = z.infer<typeof supportedParametersSchema>;

// ── Default Parameters ────────────────────────────────────────────────────

export const defaultParametersSchema = z.object({
  temperature: z.number().min(0).max(2).optional(),
  topP: z.number().min(0).max(1).optional(),
  topK: z.number().int().positive().optional(),
  maxTokens: z.number().int().positive().optional(),
  frequencyPenalty: z.number().min(-2).max(2).optional(),
  presencePenalty: z.number().min(-2).max(2).optional(),
  repetitionPenalty: z.number().min(0).max(2).optional(),
  seed: z.number().int().optional(),
  stop: z.array(z.string()).optional(),
});

export type DefaultParameters = z.infer<typeof defaultParametersSchema>;

// ── Per-Request Limits ────────────────────────────────────────────────────

export const perRequestLimitsSchema = z.object({
  maxInputTokens: z.number().int().positive().optional(),
  maxOutputTokens: z.number().int().positive().optional(),
  rpm: z.number().int().positive().optional(),
  tpm: z.number().int().positive().optional(),
});

export type PerRequestLimits = z.infer<typeof perRequestLimitsSchema>;

// ── Pricing (OpenRouter-aligned, per-token USD) ───────────────────────────

export const pricingSchema = z.object({
  input: z.number().min(0).optional(),
  output: z.number().min(0).optional(),
  cacheRead: z.number().min(0).optional(),
  image: z.number().min(0).optional(),
});

export type Pricing = z.infer<typeof pricingSchema>;

// ── Request Options ───────────────────────────────────────────────────────

export const requestOptionsSchema = z.object({
  timeoutMs: z.number().int().positive().optional(),
  maxRetries: z.number().int().min(0).max(10).optional(),
  headers: z.record(z.string(), z.string()).optional(),
});

export type RequestOptions = z.infer<typeof requestOptionsSchema>;
