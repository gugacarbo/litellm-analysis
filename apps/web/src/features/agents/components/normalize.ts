import type { SystemAgent } from "@lite-llm/contracts/agent-routing";

const DEFAULT_SYSTEM_AGENT: SystemAgent = {
  displayName: "",
  icon: "🤖",
  description: "",
  model: "",
  fallbackModels: [],
  limits: { context: 200000, output: 32768 },
  config: {
    mode: "primary",
    tools: {},
    permissions: {},
    color: "",
    disable: false,
    category: "",
    skills: [],
    temperature: 0,
    topP: 1,
    prompt: "",
    promptAppend: "",
  },
};

export function normalizeSystemAgent(
  partial: Partial<SystemAgent>,
): SystemAgent {
  return {
    ...DEFAULT_SYSTEM_AGENT,
    ...partial,
    limits: { ...DEFAULT_SYSTEM_AGENT.limits, ...partial.limits },
    config: { ...DEFAULT_SYSTEM_AGENT.config, ...partial.config },
  };
}

import type { CategoryEntry } from "@lite-llm/contracts/category";

// Normalize a partial CategoryEntry with defaults
export function normalizeCategoryEntry(
  partial: Partial<CategoryEntry>,
): CategoryEntry {
  return {
    model: partial.model ?? "",
    fallbackModels: partial.fallbackModels ?? [],
    description: partial.description ?? "",
    variant: partial.variant ?? "",
    icon: partial.icon ?? "📂",
    temperature: partial.temperature ?? 0,
    topP: partial.topP ?? 1,
    maxTokens: partial.maxTokens ?? 32768,
    thinking: partial.thinking ?? { levels: [] },
    reasoningEffort: partial.reasoningEffort ?? "medium",
    textVerbosity: partial.textVerbosity ?? "medium",
    tools: partial.tools ?? {},
    prompt_append: partial.prompt_append ?? "",
    is_unstable_agent: partial.is_unstable_agent ?? false,
  };
}
