export interface CategoryEntry {
  model: string;
  description?: string;
  variant?: string;
  icon?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  thinking?: {
    levels: string[];
  };
  reasoning?: {
    effort?: "low" | "medium" | "high" | "xhigh";
    enableThinking?: boolean;
    includeReasoningInRequest?: boolean;
    apiMode?: "openai" | "anthropic";
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
