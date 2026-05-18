import type { SystemAgent } from "@lite-llm/contracts/agent-routing";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  createSystemAgent,
  getSystemAgent,
  upsertSystemAgent,
} from "@/shared/lib/api-client/agent-catalog";
import type { AgentConfigFormData } from "./agent-config-types";
import { normalizeSystemAgent } from "./components/normalize";

function systemAgentToFormData(agent: SystemAgent): AgentConfigFormData {
  return {
    id: agent.id ?? "",
    displayName: agent.displayName ?? "",
    icon: agent.icon ?? "🤖",
    description: agent.description ?? "",
    model: agent.model ?? "",
    fallbackModels: agent.fallbackModels ?? [],
    limits: agent.limits ?? { context: 200000, output: 32768 },
    config: {
      mode: agent.config?.mode ?? "subagent",
      tools: agent.config?.tools ?? {},
      permissions: agent.config?.permissions ?? {},
      color: agent.config?.color ?? "#555555",
      disable: agent.config?.disable ?? false,
      variant: agent.config?.variant ?? "",
      category: agent.config?.category ?? "",
      skills: agent.config?.skills ?? [],
      temperature: agent.config?.temperature ?? 0,
      topP: agent.config?.topP ?? 1,
      prompt: agent.config?.prompt ?? "",
      promptAppend: agent.config?.promptAppend ?? "",
    },
  };
}

function formDataToSystemAgent(formData: AgentConfigFormData): SystemAgent {
  return {
    id: formData.id,
    displayName: formData.displayName,
    icon: formData.icon,
    description: formData.description,
    model: formData.model,
    fallbackModels: formData.fallbackModels,
    limits: formData.limits,
    config: {
      mode: formData.config.mode,
      tools: formData.config.tools,
      permissions: formData.config.permissions,
      color: formData.config.color,
      disable: formData.config.disable,
      variant: formData.config.variant,
      category: formData.config.category,
      skills: formData.config.skills,
      temperature: formData.config.temperature,
      topP: formData.config.topP,
      prompt: formData.config.prompt,
      promptAppend: formData.config.promptAppend,
    },
  };
}

export function useAgentConfigPage(): {
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
} {
  const { id } = useParams() as { id: string };
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const isNew = id === "new";

  const agentQuery = useQuery({
    queryKey: ["system-agent", id],
    queryFn: () => (isNew ? null : getSystemAgent(id)),
    enabled: !isNew,
  });

  const saveMutation = useMutation({
    mutationFn: async (agent: SystemAgent) => {
      if (isNew) {
        await createSystemAgent(agent);
      } else {
        await upsertSystemAgent(id, agent);
      }
    },
  });

  const agent = useMemo(() => {
    if (isNew) return null;
    if (!agentQuery.data) return null;
    return normalizeSystemAgent(agentQuery.data.agent);
  }, [isNew, agentQuery.data]);

  const getInitialFormData = useCallback((): AgentConfigFormData => {
    if (agent) {
      return systemAgentToFormData(agent);
    }
    return {
      id: "",
      displayName: "",
      icon: "🤖",
      description: "",
      model: "",
      fallbackModels: [],
      limits: { context: 200000, output: 32768 },
      config: {
        mode: "subagent",
        tools: {},
        permissions: {},
        color: "#555555",
        disable: false,
        variant: "",
        category: "",
        skills: [],
        temperature: 0,
        topP: 1,
        prompt: "",
        promptAppend: "",
      },
    };
  }, [agent]);

  const [formData, setFormData] =
    useState<AgentConfigFormData>(getInitialFormData);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    if (!isNew) {
      setFormData(getInitialFormData());
      setIsDirty(false);
    }
  }, [isNew, getInitialFormData]);

  const handleFormDataChange = useCallback(
    (next: Partial<AgentConfigFormData>) => {
      setFormData((prev) => {
        const updated = { ...prev, ...next };
        if (isNew && next.displayName) {
          const slug = next.displayName
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, "")
            .replace(/[\s_-]+/g, "-")
            .replace(/^-+|-+$/g, "");
          updated.id = slug || "agent";
        }
        return updated;
      });
      setIsDirty(true);
    },
    [isNew],
  );

  const handleSave = useCallback(async () => {
    try {
      const agentToSave = formDataToSystemAgent(formData);
      await saveMutation.mutateAsync(agentToSave);
      await queryClient.invalidateQueries({ queryKey: ["system-agent", id] });
      await queryClient.invalidateQueries({ queryKey: ["agent-catalog"] });
      toast.success(isNew ? "Agent created" : "Agent configuration saved");
      setIsDirty(false);
      if (isNew) {
        navigate(`/agents/${formData.id}`);
      }
    } catch (e) {
      toast.error(`Failed to save: ${e}`);
    }
  }, [formData, saveMutation, queryClient, isNew, navigate, id]);

  const loading = !isNew && agentQuery.isPending;
  const error = agentQuery.error ? String(agentQuery.error) : null;
  const notFound =
    !loading && !isNew && agentQuery.data === undefined && !agent;

  return {
    agent,
    loading,
    error,
    notFound,
    formData,
    isDirty,
    saving: saveMutation.isPending,
    onFormDataChange: handleFormDataChange,
    onSave: handleSave,
    onBack: () => navigate("/agents"),
    isNew,
  };
}
