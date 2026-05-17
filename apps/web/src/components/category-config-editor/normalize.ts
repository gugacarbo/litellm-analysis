import type { CategoryEntry } from "@lite-llm/api-contracts/category";

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
    top_p: partial.top_p ?? 1,
    maxTokens: partial.maxTokens ?? 32768,
    thinking: partial.thinking ?? { levels: [] },
    reasoningEffort: partial.reasoningEffort ?? "medium",
    textVerbosity: partial.textVerbosity ?? "medium",
    tools: partial.tools ?? {},
    prompt_append: partial.prompt_append ?? "",
    is_unstable_agent: partial.is_unstable_agent ?? false,
  };
}
