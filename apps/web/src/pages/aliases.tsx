"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Database } from "lucide-react";
import { useState } from "react";
import { AgentRoutingAliasDialog } from "../components/agent-routing/agent-routing-alias-dialog";
import { AgentRoutingAliasesTab } from "../components/agent-routing/agent-routing-aliases-tab";
import {
  type AgentRoutingAPIResponse,
  getAgentRoutingConfig,
  updateAgentRoutingConfig,
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";
import { getAliasesGrouped } from "./models/models-alias-utils";

export function AliasesPage() {
  const queryClient = useQueryClient();

  const aliasesQuery = useQuery({
    queryKey: queryKeys.agentRoutingAliases,
    queryFn: getAgentRoutingConfig,
  });

  const updateMutation = useMutation({
    mutationFn: (modelGroupAlias: AgentRoutingAPIResponse) =>
      updateAgentRoutingConfig(modelGroupAlias),
  });

  const [aliasDialogOpen, setAliasDialogOpen] = useState(false);
  const [aliasDialogMode, setAliasDialogMode] = useState<"add" | "edit">("add");
  const [aliasDialogKey, setAliasDialogKey] = useState("");
  const [aliasDialogValue, setAliasDialogValue] = useState("");
  const [aliasError, setAliasError] = useState<string | null>(null);

  const aliasGroups = getAliasesGrouped(aliasesQuery.data);

  function openAddAlias() {
    setAliasDialogMode("add");
    setAliasDialogKey("");
    setAliasDialogValue("");
    setAliasError(null);
    setAliasDialogOpen(true);
  }

  function openEditAlias(key: string, value: string) {
    setAliasDialogMode("edit");
    setAliasDialogKey(key);
    setAliasDialogValue(value);
    setAliasError(null);
    setAliasDialogOpen(true);
  }

  async function handleAliasSave() {
    const key = aliasDialogKey.trim();
    const value = aliasDialogValue.trim();
    if (!key || !value) return;

    try {
      setAliasError(null);
      await updateMutation.mutateAsync({ [key]: value });

      queryClient.setQueryData<AgentRoutingAPIResponse>(
        queryKeys.agentRoutingAliases,
        (previous) => ({ ...(previous ?? {}), [key]: value }),
      );

      setAliasDialogOpen(false);
    } catch (e) {
      setAliasError(String(e));
    }
  }

  async function handleAliasDelete(key: string) {
    try {
      setAliasError(null);
      await updateMutation.mutateAsync({ [key]: "" });

      queryClient.setQueryData<AgentRoutingAPIResponse>(
        queryKeys.agentRoutingAliases,
        (previous) => {
          if (!previous) return previous;
          const next = { ...previous };
          delete next[key];
          return next;
        },
      );
    } catch (e) {
      setAliasError(String(e));
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Database className="h-8 w-8" />
          Custom Aliases
        </h1>
        <p className="text-muted-foreground mt-1">
          Route additional model names to configured models
        </p>
      </div>

      <AgentRoutingAliasesTab
        loading={aliasesQuery.isPending && !aliasesQuery.data}
        saving={updateMutation.isPending}
        error={aliasError}
        aliasGroups={aliasGroups}
        onOpenAddAlias={openAddAlias}
        onOpenEditAlias={openEditAlias}
        onDeleteAlias={handleAliasDelete}
      />

      <AgentRoutingAliasDialog
        open={aliasDialogOpen}
        mode={aliasDialogMode}
        saving={updateMutation.isPending}
        aliasKey={aliasDialogKey}
        aliasValue={aliasDialogValue}
        onOpenChange={setAliasDialogOpen}
        onAliasKeyChange={setAliasDialogKey}
        onAliasValueChange={setAliasDialogValue}
        onSave={handleAliasSave}
      />
    </div>
  );
}

export default AliasesPage;
