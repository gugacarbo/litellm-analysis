"use client";

import { Settings } from "lucide-react";
import { AgentConfigEditor } from "../components/agent-config-editor";
import { AgentRoutingAgentsTab } from "../components/agent-routing/agent-routing-agents-tab";
import { PageLayout } from "../components/ui/page-layout";
import { useAgentRoutingPageState } from "./agents/use-agent-routing-page";

export function AgentsPage() {
  const {
    agents,
    loading,
    saving,
    dialogOpen,
    editingAgentId,
    setDialogOpen,
    handleSaveAgent,
    handleDeleteAgent,
    openAgentEditor,
  } = useAgentRoutingPageState();

  const editingAgent = agents.find((a) => a.id === editingAgentId) ?? null;

  return (
    <PageLayout
      title="Agents"
      subtitle="Manage system agents and their configurations"
      icon={Settings}
    >
      <AgentRoutingAgentsTab
        loading={loading}
        agents={agents}
        onOpenAgentConfig={openAgentEditor}
        onDeleteAgent={handleDeleteAgent}
      />

      <AgentConfigEditor
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        agent={editingAgent}
        onSave={handleSaveAgent}
        saving={saving}
      />
    </PageLayout>
  );
}
