import type { SystemAgent } from "@lite-llm/api-contracts/agent-routing";

export function normalizeSystemAgent(
  partial: Partial<SystemAgent> & { id?: string },
): SystemAgent {
  const id = partial.id ?? "default";
  return {
    id,
    displayName: partial.displayName ?? id,
    icon: partial.icon ?? "🔧",
    description: partial.description ?? "",
    versions: partial.versions ?? [],
    model: partial.model ?? "",
    fallbackModels: partial.fallbackModels ?? [],
    enabledPlugins: partial.enabledPlugins ?? [],
    config: {
      mode: partial.config?.mode ?? "subagent",
      tools: partial.config?.tools ?? {},
      permissions: partial.config?.permissions ?? {},
      color: partial.config?.color ?? "#555555",
      disable: partial.config?.disable ?? false,
      variant: partial.config?.variant,
      category: partial.config?.category,
      skills: partial.config?.skills ?? [],
      temperature: partial.config?.temperature,
      topP: partial.config?.topP,
      prompt: partial.config?.prompt,
      promptAppend: partial.config?.promptAppend,
    },
  };
}
