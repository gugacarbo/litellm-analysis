"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { GitBranch, Settings } from "lucide-react";
import { useState } from "react";
import { AgentRoutingAliasDialog } from "../components/agent-routing/agent-routing-alias-dialog";
import { AgentRoutingAliasesTab } from "../components/agent-routing/agent-routing-aliases-tab";
import { PluginRoutingGrid } from "../components/plugin-routing/plugin-routing-grid";
import { PageLayout } from "../components/ui/page-layout";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  type AgentRoutingAPIResponse,
  getAgentDefinitions,
  getAgentRoutingConfig,
  updateAgentRoutingConfig,
} from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";
import { getAliasesGrouped } from "./models/models-alias-utils";
import { usePluginRoutingPage } from "./plugin-routing/use-plugin-routing-page";

export function PluginsPage() {
  const pluginState = usePluginRoutingPage();

  // Aliases state
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
    mutationFn: (modelGroupAlias: AgentRoutingAPIResponse) =>
      updateAgentRoutingConfig(modelGroupAlias),
  });

  const [aliasDialogOpen, setAliasDialogOpen] = useState(false);
  const [aliasDialogMode, setAliasDialogMode] = useState<"add" | "edit">("add");
  const [aliasDialogKey, setAliasDialogKey] = useState("");
  const [aliasDialogValue, setAliasDialogValue] = useState("");
  const [aliasError, setAliasError] = useState<string | null>(null);

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
    <PageLayout
      title="Plugins & Routing"
      subtitle="Configure plugin routing and model aliases"
      icon={Settings}
    >
      <Tabs defaultValue="plugins">
        <TabsList>
          <TabsTrigger value="plugins">
            <GitBranch className="h-4 w-4 me-1.5" />
            Plugins
          </TabsTrigger>
          <TabsTrigger value="aliases">Aliases</TabsTrigger>
        </TabsList>

        <TabsContent value="plugins" className="mt-4">
          <PluginRoutingGrid
            plugins={pluginState.plugins}
            loading={pluginState.loading}
            onTogglePlugin={pluginState.handleTogglePlugin}
            onToggleAgent={pluginState.handleToggleAgent}
          />
        </TabsContent>

        <TabsContent value="aliases" className="mt-4">
          <AgentRoutingAliasesTab
            loading={aliasesQuery.isPending && !aliasesQuery.data}
            saving={updateMutation.isPending}
            error={aliasError}
            aliasGroups={aliasGroups}
            onOpenAddAlias={openAddAlias}
            onOpenEditAlias={openEditAlias}
            onDeleteAlias={handleAliasDelete}
          />
        </TabsContent>
      </Tabs>

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
    </PageLayout>
  );
}
