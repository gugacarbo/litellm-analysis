"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GitBranch } from "lucide-react";
import { useState } from "react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AgentRoutingAliasDialog } from "../components/agent-routing/agent-routing-alias-dialog";
import { AgentRoutingAliasesTab } from "../components/agent-routing/agent-routing-aliases-tab";
import { PageLayout } from "../components/ui/page-layout";
import {
  getAgentDefinitions,
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
  const definitionsQuery = useQuery({
    queryKey: queryKeys.agentDefinitions,
    queryFn: getAgentDefinitions,
  });
  const updateMutation = useMutation({
    mutationFn: (modelGroupAlias) => updateAgentRoutingConfig(modelGroupAlias),
  });
  const [aliasDialogOpen, setAliasDialogOpen] = useState(false);
  const [aliasDialogMode, setAliasDialogMode] = useState("add");
  const [aliasDialogKey, setAliasDialogKey] = useState("");
  const [aliasDialogValue, setAliasDialogValue] = useState("");
  const [aliasError, setAliasError] = useState(null);
  const aliasGroups = getAliasesGrouped(
    aliasesQuery.data,
    definitionsQuery.data?.agents,
    definitionsQuery.data?.categories,
  );
  function openAddAlias() {
    setAliasDialogMode("add");
    setAliasDialogKey("");
    setAliasDialogValue("");
    setAliasError(null);
    setAliasDialogOpen(true);
  }
  function openEditAlias(key, value) {
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
      queryClient.setQueryData(queryKeys.agentRoutingAliases, (previous) => ({
        ...(previous ?? {}),
        [key]: value,
      }));
      setAliasDialogOpen(false);
    } catch (e) {
      setAliasError(String(e));
    }
  }
  async function handleAliasDelete(key) {
    try {
      setAliasError(null);
      await updateMutation.mutateAsync({ [key]: "" });
      queryClient.setQueryData(queryKeys.agentRoutingAliases, (previous) => {
        if (!previous) return previous;
        const next = { ...previous };
        delete next[key];
        return next;
      });
    } catch (e) {
      setAliasError(String(e));
    }
  }
  return _jsxs(PageLayout, {
    title: "Custom Aliases",
    subtitle: "Route additional model names to configured models",
    icon: GitBranch,
    children: [
      _jsx(AgentRoutingAliasesTab, {
        loading: aliasesQuery.isPending && !aliasesQuery.data,
        saving: updateMutation.isPending,
        error: aliasError,
        aliasGroups: aliasGroups,
        onOpenAddAlias: openAddAlias,
        onOpenEditAlias: openEditAlias,
        onDeleteAlias: handleAliasDelete,
      }),
      _jsx(AgentRoutingAliasDialog, {
        open: aliasDialogOpen,
        mode: aliasDialogMode,
        saving: updateMutation.isPending,
        aliasKey: aliasDialogKey,
        aliasValue: aliasDialogValue,
        onOpenChange: setAliasDialogOpen,
        onAliasKeyChange: setAliasDialogKey,
        onAliasValueChange: setAliasDialogValue,
        onSave: handleAliasSave,
      }),
    ],
  });
}
export default AliasesPage;
