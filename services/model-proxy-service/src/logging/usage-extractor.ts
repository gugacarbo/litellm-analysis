export interface UsageSummary {
  cachedTokens?: number;
  inputTokens?: number;
  outputTokens?: number;
  reasoningTokens?: number;
  totalTokens?: number;
  usageEstimated?: boolean;
}

function toObject(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

function readNumber(value: unknown): number | undefined {
  return typeof value === "number" ? value : undefined;
}

function readNestedUsage(root: Record<string, unknown>): UsageSummary {
  const usage = toObject(root.usage);
  if (!usage) {
    return {};
  }

  const details = toObject(usage.prompt_tokens_details);
  const completionDetails = toObject(usage.completion_tokens_details);

  return {
    inputTokens:
      readNumber(usage.prompt_tokens) ?? readNumber(usage.input_tokens),
    outputTokens:
      readNumber(usage.completion_tokens) ?? readNumber(usage.output_tokens),
    totalTokens: readNumber(usage.total_tokens),
    cachedTokens:
      readNumber(usage.cached_tokens) ?? readNumber(details?.cached_tokens),
    reasoningTokens:
      readNumber(usage.reasoning_tokens) ??
      readNumber(completionDetails?.reasoning_tokens),
  };
}

export function extractUsage(payload: unknown): UsageSummary {
  const root = toObject(payload);
  if (!root) {
    return {};
  }

  return readNestedUsage(root);
}

export function estimateUsageFromContent(content: string): UsageSummary {
  const estimatedTokens = Math.max(1, Math.ceil(content.length / 4));
  return {
    inputTokens: estimatedTokens,
    outputTokens: estimatedTokens,
    totalTokens: estimatedTokens * 2,
    usageEstimated: true,
  };
}

export function mergeUsage(
  current: UsageSummary,
  incoming: UsageSummary,
): UsageSummary {
  const merged: UsageSummary = { ...current };

  if (incoming.inputTokens !== undefined) {
    merged.inputTokens = incoming.inputTokens;
  }
  if (incoming.outputTokens !== undefined) {
    merged.outputTokens = incoming.outputTokens;
  }
  if (incoming.totalTokens !== undefined) {
    merged.totalTokens = incoming.totalTokens;
  }
  if (incoming.cachedTokens !== undefined) {
    merged.cachedTokens = incoming.cachedTokens;
  }
  if (incoming.reasoningTokens !== undefined) {
    merged.reasoningTokens = incoming.reasoningTokens;
  }
  if (incoming.usageEstimated) {
    merged.usageEstimated = true;
  }

  return merged;
}

export function readUsageFromStreamBuffer(
  buffer: string,
  usage: UsageSummary,
): UsageSummary {
  const lines = buffer.split("\n\n");
  let merged = usage;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) {
      continue;
    }

    const payload = trimmed.slice(5).trim();
    if (!payload || payload === "[DONE]") {
      continue;
    }

    try {
      const parsed = JSON.parse(payload) as unknown;
      merged = mergeUsage(merged, extractUsage(parsed));
    } catch {
      // Ignore partial JSON fragments while the stream is still flowing.
    }
  }

  return merged;
}
