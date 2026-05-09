import type { SystemAgent } from "@lite-llm/api-contracts/agent-routing";

export type AgentFocusViewProps = {
  loading: boolean;
  agents: SystemAgent[];
  onOpenAgentConfig: (id: string) => void;
  onDeleteAgent: (id: string) => void;
};

export type AgentTabProps = {
  loading: boolean;
  agents: SystemAgent[];
  onOpenAgentConfig: (id: string) => void;
  onDeleteAgent: (id: string) => void;
};
