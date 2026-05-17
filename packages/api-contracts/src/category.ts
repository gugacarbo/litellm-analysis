export interface CategoryEntry {
  model: string;
  fallbackModels?: string[];
  description?: string;
  variant?: string;
  icon?: string;
 temperature?: number;
  topP?: number;
 maxTokens?: number;
  thinking?: {
    levels: string[];
  };
  reasoningEffort?: "low" | "medium" | "high" | "xhigh";
  textVerbosity?: "low" | "medium" | "high";
  tools?: Record<string, boolean>;
  prompt_append?: string;
  is_unstable_agent?: boolean;
  limits?: {
    context?: number;
    output?: number;
  };
  cost?: {
    input?: number;
    output?: number;
  };
  promptAppend?: string;
  isUnstableAgent?: boolean;
}
