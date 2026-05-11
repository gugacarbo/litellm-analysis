export interface CategoryEntry {
  model: string;
  fallbackModels?: string[];
  description?: string;
  variant?: string;
  temperature?: number;
  top_p?: number;
  maxTokens?: number;
  thinking?: {
    type: "enabled" | "disabled";
    budgetTokens?: number;
  };
  reasoningEffort?: "low" | "medium" | "high" | "xhigh";
  textVerbosity?: "low" | "medium" | "high";
  tools?: Record<string, boolean>;
  prompt_append?: string;
  is_unstable_agent?: boolean;
}
