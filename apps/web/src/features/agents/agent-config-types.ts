export interface AgentConfigFormData {
  id: string;
  displayName: string;
  icon: string;
  description: string;
  model: string;
  limits: {
    context: number;
    output: number;
  };
  config: {
    mode: "subagent" | "primary" | "all";
    tools: Record<string, boolean>;
    permissions: Record<string, unknown>;
    color: string;
    disable: boolean;
    variant: string;
    category: string;
    skills: string[];
    temperature: number;
    topP: number;
    prompt: string;
    promptAppend: string;
  };
}
