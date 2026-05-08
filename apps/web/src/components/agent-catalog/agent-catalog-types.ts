import type { SystemAgentDTO } from "@lite-llm/api-contracts/agent-catalog";

export type AgentCatalogCardProps = {
  agent: SystemAgentDTO;
  onEdit: (agent: SystemAgentDTO) => void;
  onDelete: (id: string) => void;
};

export type AgentCatalogGridProps = {
  agents: SystemAgentDTO[];
  loading: boolean;
  onEdit: (agent: SystemAgentDTO) => void;
  onDelete: (id: string) => void;
  onCreate: () => void;
};

export type AgentCatalogFormProps = {
  agent?: SystemAgentDTO | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: CreateFormValues) => void;
};

export type CreateFormValues = {
  displayName: string;
  icon: string;
  description: string;
  model: string;
  fallbackModels: string[];
  mode?: string;
  color?: string;
};
