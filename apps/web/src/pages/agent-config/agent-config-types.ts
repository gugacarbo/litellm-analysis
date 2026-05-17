import type { SystemAgent } from "@lite-llm/api-contracts/agent-routing";

export interface AgentConfigFormData {
  id: string;
  displayName: string;
  icon: string;
  description: string;
  model: string;
  fallbackModels: string[];
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

export interface UseAgentConfigPageResult {
  agent: SystemAgent | null;
  loading: boolean;
  error: string | null;
  notFound: boolean;
  formData: AgentConfigFormData;
  isDirty: boolean;
  saving: boolean;
  onFormDataChange: (next: Partial<AgentConfigFormData>) => void;
  onSave: () => void;
  onBack: () => void;
  isNew: boolean;
}
