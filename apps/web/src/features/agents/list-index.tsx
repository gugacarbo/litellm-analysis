"use client";

import { Settings } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CategoryConfigEditor } from "../../components/category-config-editor/category-config-editor";
import { PageLayout } from "../../components/ui/page-layout";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../../components/ui/tabs";
import { AgentRoutingAgentsTab } from "../agent-routing/components/agent-routing-agents-tab";
import { AgentRoutingCategoriesTab } from "../agent-routing/components/agent-routing-categories-tab";
import { AgentConfigEditor } from "./components/agent-config-editor";
import { useAgentRoutingPageState } from "./use-agent-routing-page";

export function AgentsPage() {
  const navigate = useNavigate();
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
    categoryDialogOpen,
    editingCategoryKey,
    setCategoryDialogOpen,
    handleSaveCategory,
    handleDeleteCategory,
    openCategoryEditor,
  } = useAgentRoutingPageState();

  const editingAgent =
    agents.find(
      (a) => a.id === editingAgentId || a.displayName === editingAgentId,
    ) ?? null;
  const editingCategory = editingCategoryKey
    ? categories[editingCategoryKey]
    : null;

  const handleAddAgent = () => {
    navigate("/agents/new");
  };

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
            onAddAgent={handleAddAgent}
          />
        </TabsContent>
        <TabsContent value="categories">
          <AgentRoutingCategoriesTab
            loading={categoriesLoading}
            categories={categories}
            onCreateCategory={() => openCategoryEditor(null)}
            onEditCategory={openCategoryEditor}
            onDeleteCategory={handleDeleteCategory}
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

      <CategoryConfigEditor
        open={categoryDialogOpen}
        onOpenChange={setCategoryDialogOpen}
        categoryKey={editingCategoryKey}
        category={editingCategory}
        onSave={handleSaveCategory}
        saving={saving}
        isNew={editingCategoryKey === null}
      />
    </PageLayout>
  );
}
