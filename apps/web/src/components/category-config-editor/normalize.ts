import type { CategoryConfig } from "../../types/agent-routing";

export function normalizeCategoryConfig(
  initialConfig: CategoryConfig = {},
): CategoryConfig {
  return {
    model: initialConfig.model ?? "",
    fallback_models: initialConfig.fallback_models ?? [],
    tools: initialConfig.tools ?? {},
    description: initialConfig.description,
    variant: initialConfig.variant,
    temperature: initialConfig.temperature,
    top_p: initialConfig.top_p,
    maxTokens: initialConfig.maxTokens,
    thinking: initialConfig.thinking,
    reasoningEffort: initialConfig.reasoningEffort,
    textVerbosity: initialConfig.textVerbosity,
    prompt_append: initialConfig.prompt_append,
    is_unstable_agent: initialConfig.is_unstable_agent,
  };
}
