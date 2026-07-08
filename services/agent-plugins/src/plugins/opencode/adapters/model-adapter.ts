import type { ModelSpec } from "@lite-llm/models-repository/schemas";

function resolveModelName(
  displayName: string | undefined,
  fallbackName: string,
): string {
  const trimmedName = displayName?.trim();
  return trimmedName && trimmedName.length > 0 ? trimmedName : fallbackName;
}

function buildReasoningConfig(spec: ModelSpec):
  | {
      reasoning: boolean;
      interleaved?: true | { field: string };
      options?: { reasoningEffort: string };
    }
  | undefined {
  const reasoning = spec.reasoning;
  if (!reasoning) return undefined;

  const reasoningEffort = reasoning.effort;

  return {
    reasoning: true,
    ...(reasoningEffort ? { options: { reasoningEffort } } : {}),
    interleaved: { field: "reasoning_content" as const },
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
      context: spec.contextLength,
      output: spec.maxCompletionTokens,
    },
  };

  if (spec.pricing?.input != null || spec.pricing?.output != null) {
    entry.cost = {
      ...(spec.pricing?.input != null
        ? { input: spec.pricing.input * 1_000_000 }
        : {}),
      ...(spec.pricing?.output != null
        ? { output: spec.pricing.output * 1_000_000 }
        : {}),
    };
  }

  const reasoningConfig = buildReasoningConfig(spec);
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
