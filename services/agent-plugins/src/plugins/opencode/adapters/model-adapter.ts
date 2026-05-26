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

export function modelAdapter(
  agentRole: string,
  aliasKey: string,
  displayName: string,
  spec: ModelSpec,
): Record<string, unknown> {
  const entry: Record<string, unknown> = {
    id: `${agentRole}/${aliasKey}`,
    name: displayName,
    limit: {
      context: spec.limits.length,
      output: spec.limits.maxOutput,
    },
  };

  if (spec.cost?.input != null || spec.cost?.output != null) {
    entry.cost = {
      ...(spec.cost?.input != null ? { input: spec.cost.input } : {}),
      ...(spec.cost?.output != null ? { output: spec.cost.output } : {}),
    };
  }

  const thinkingVariants = buildThinkingVariants(spec);
  if (thinkingVariants) {
    entry.variants = thinkingVariants;
  }

  return entry;
}
