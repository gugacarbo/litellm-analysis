import type { AgentConfig } from "../../types/agent-routing";

export function normalizeAgentConfig(
  initialConfig: AgentConfig = {},
): AgentConfig {
  const result: AgentConfig = {
    model: initialConfig.model ?? "",
    fallback_models: initialConfig.fallback_models ?? [],
    tools: initialConfig.tools ?? {},
    disable: initialConfig.disable ?? false,
    description: initialConfig.description,
    color: initialConfig.color,
    mode: initialConfig.mode,
    variant: initialConfig.variant,
    category: initialConfig.category,
    skills: initialConfig.skills,
    temperature: initialConfig.temperature,
    top_p: initialConfig.top_p,
    prompt: initialConfig.prompt,
    prompt_append: initialConfig.prompt_append,
    permission: initialConfig.permission,
  };
  if (result.mode === undefined) {
    result.mode = "subagent";
  }
  return result;
}
