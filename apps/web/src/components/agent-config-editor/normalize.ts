import type { SystemAgent } from "@lite-llm/api-contracts/agent-routing";

/**
 * Generate a slug from a display name
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Generate a slug from displayName, used when creating new agents
 */
export function generateId(displayName: string): string {
  return slugify(displayName) || "agent";
}

export function normalizeSystemAgent(
  partial: Partial<SystemAgent>,
): SystemAgent {
  return {
    id:
      partial.id ??
      (partial.displayName ? generateId(partial.displayName) : ""),
    displayName: partial.displayName ?? "default",
    icon: partial.icon ?? "🔧",
    description: partial.description ?? "",
    limits: partial.limits ?? { context: 200000, output: 32768 },
    model: partial.model ?? "",
    fallbackModels: partial.fallbackModels ?? [],
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
