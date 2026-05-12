"use client";

import { Settings } from "lucide-react";
import { useState } from "react";
import { AgentConfigEditor } from "../components/agent-config-editor";
import { AgentRoutingAgentsTab } from "../components/agent-routing/agent-routing-agents-tab";
import { AgentRoutingCategoriesTab } from "../components/agent-routing/agent-routing-categories-tab";
import { PageLayout } from "../components/ui/page-layout";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { useAgentRoutingPageState } from "./agents/use-agent-routing-page";

export function AgentsPage() {
  const [activeTab, setActiveTab] = useState<"agents" | "categories">("agents");

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
    categories,
    categoriesLoading,
  } = useAgentRoutingPageState();

  const editingAgent =
    agents.find((a) => a.displayName === editingAgentId) ?? null;

  return (
    <PageLayout
      title="Agents"
      subtitle="Manage system agents and their configurations"
      icon={Settings}
    >
      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          setActiveTab(value as "agents" | "categories")
        }
      >
        <TabsList>
          <TabsTrigger value="agents">Agents</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
        </TabsList>
        <TabsContent value="agents">
          <AgentRoutingAgentsTab
            loading={loading}
            agents={agents}
            onOpenAgentConfig={openAgentEditor}
            onDeleteAgent={handleDeleteAgent}
          />
        </TabsContent>
        <TabsContent value="categories">
          <AgentRoutingCategoriesTab
            loading={categoriesLoading}
            categories={categories}
          />
        </TabsContent>
      </Tabs>

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
