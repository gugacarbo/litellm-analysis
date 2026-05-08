import type { SystemAgentDTO } from "@lite-llm/api-contracts/agent-catalog";
import { useCallback, useState } from "react";
import {
  useAgentCatalog,
  useCreateAgent,
  useDeleteAgent,
  useUpdateAgent,
} from "@/hooks/use-agent-catalog";
import type { CreateSystemAgentDTO } from "@/lib/api-client/agent-catalog";
import type { CreateFormValues } from "../../components/agent-catalog/agent-catalog-types";

export function useAgentCatalogPage() {
  const {
    data: agents = [],
    isPending: loading,
    error: queryError,
  } = useAgentCatalog();
  const createAgent = useCreateAgent();
  const updateAgent = useUpdateAgent();
  const deleteAgent = useDeleteAgent();

  const [formOpen, setFormOpen] = useState(false);
  const [editingAgent, setEditingAgent] = useState<SystemAgentDTO | null>(null);

  const openCreateForm = useCallback(() => {
    setFormOpen(true);
    setEditingAgent(null);
  }, []);

  const openEditForm = useCallback((agent: SystemAgentDTO) => {
    setFormOpen(true);
    setEditingAgent(agent);
  }, []);

  const closeForm = useCallback(() => {
    setFormOpen(false);
    setEditingAgent(null);
  }, []);

  const handleCreate = useCallback(
    (data: CreateFormValues) => {
      const payload: CreateSystemAgentDTO = {
        ...data,
        versions: [{ name: "v1", model: data.model, enabled: true }],
      };
      createAgent.mutate(payload);
      closeForm();
    },
    [createAgent, closeForm],
  );

  const handleUpdate = useCallback(
    (data: CreateFormValues) => {
      if (!editingAgent) return;
      updateAgent.mutate({ id: editingAgent.id, data });
      closeForm();
    },
    [editingAgent, updateAgent, closeForm],
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteAgent.mutate(id);
    },
    [deleteAgent],
  );

  const agentCount = agents.length;
  const enabledAgentCount = agents.filter((a) => !a.disable).length;

  const error = queryError?.message ?? null;

  return {
    agents,
    loading,
    error,
    formOpen,
    editingAgent,
    openCreateForm,
    openEditForm,
    closeForm,
    handleCreate,
    handleUpdate,
    handleDelete,
    agentCount,
    enabledAgentCount,
  };
}
