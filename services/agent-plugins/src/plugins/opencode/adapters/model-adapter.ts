import type { ModelSpec } from "@lite-llm/models-repository/schemas";

const OPENCODE_REASONING_EFFORT_LEVELS = new Set([
  "none",
  "minimal",
  "low",
  "medium",
  "high",
  "xhigh",
]);

function normalizeThinkingLevel(level: string): string | null {
  const normalized = level
    .trim()
    .toLowerCase()
    .replace(/[\s_-]/g, "");
  if (!normalized) return null;
  if (normalized === "off" || normalized === "disabled") return "none";
  if (OPENCODE_REASONING_EFFORT_LEVELS.has(normalized)) return normalized;
  return null;
}

function buildThinkingVariants(
  model: ModelSpec,
): Record<string, { reasoningEffort: string }> | undefined {
  const levels = model.thinking?.levels ?? [];
  if (levels.length === 0) return undefined;

  const variants: Record<string, { reasoningEffort: string }> = {};
  for (const level of levels) {
    const normalizedLevel = normalizeThinkingLevel(level);
    if (!normalizedLevel) continue;
    variants[normalizedLevel] = { reasoningEffort: normalizedLevel };
  }
  return Object.keys(variants).length > 0 ? variants : undefined;
}

function resolveModelName(
  displayName: string | undefined,
  fallbackName: string,
): string {
  const trimmedName = displayName?.trim();
  return trimmedName && trimmedName.length > 0 ? trimmedName : fallbackName;
}

function buildReasoningConfig(
  spec: ModelSpec,
  thinkingVariants?: Record<string, { reasoningEffort: string }>,
):
  | {
      reasoning: boolean;
      interleaved?: true | { field: string };
      options?: { reasoningEffort: string };
    }
  | undefined {
  const reasoning = spec.reasoning;
  const hasThinkingVariants =
    thinkingVariants !== undefined && Object.keys(thinkingVariants).length > 0;
  const reasoningEffort = reasoning?.effort;
  const hasReasoningEffort = reasoningEffort !== undefined;
  const shouldEnableReasoning =
    hasReasoningEffort ||
    reasoning?.enableThinking === true ||
    reasoning?.includeReasoningInRequest === true ||
    hasThinkingVariants;

  if (!shouldEnableReasoning) return undefined;

  return {
    reasoning: true,
    ...(hasReasoningEffort ? { options: { reasoningEffort } } : {}),
    ...(reasoning?.includeReasoningInRequest === true
      ? { interleaved: { field: "reasoning_content" as const } }
      : {}),
  };
}

export function modelAdapter(
  exportedId: string,
  modelId: string,
  displayName: string | undefined,
  spec: ModelSpec,
): Record<string, unknown> {
  const entry: Record<string, unknown> = {
    id: exportedId,
    name: resolveModelName(displayName, modelId),
    limit: {
      context: spec.limits.length,
      output: spec.limits.maxOutput,
    },
  };

  if (spec.cost?.input != null || spec.cost?.output != null) {
    // The OpenCode plugin schema expects cost in USD per million tokens
    // (see `opencode.schema.json` → `cost.input` / `cost.output`).
    // Our canonical `costSchema` stores values in USD per token, so we
    // convert here at the export boundary.
    entry.cost = {
      ...(spec.cost?.input != null
        ? { input: spec.cost.input * 1_000_000 }
        : {}),
      ...(spec.cost?.output != null
        ? { output: spec.cost.output * 1_000_000 }
        : {}),
    };
  }

  const thinkingVariants = buildThinkingVariants(spec);
  if (thinkingVariants) {
    entry.variants = thinkingVariants;
  }

  const reasoningConfig = buildReasoningConfig(spec, thinkingVariants);
  if (reasoningConfig) {
    entry.reasoning = reasoningConfig.reasoning;
    if (reasoningConfig.options) {
      entry.options = reasoningConfig.options;
    }
    if (reasoningConfig.interleaved) {
      entry.interleaved = reasoningConfig.interleaved;
    }
  }

  return entry;
}
