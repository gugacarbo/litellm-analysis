"use client";

import { Database, RefreshCw, Settings } from "lucide-react";
import { AgentConfigEditor } from "../components/agent-config-editor";
import { AgentRoutingAgentsTab } from "../components/agent-routing/agent-routing-agents-tab";
import { AgentRoutingCategoriesTab } from "../components/agent-routing/agent-routing-categories-tab";
import { CategoryConfigEditor } from "../components/category-config-editor";
import { GlobalFallbackSelector } from "../components/global-fallback-selector";
import { Button } from "../components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  AGENT_DEFINITIONS,
  CATEGORY_DEFINITIONS,
} from "@lite-llm/api-contracts/agent-routing";
import { useAgentRoutingPageState } from "./agent-routing/use-agent-routing-page";

export function AgentRoutingPage() {
  const state = useAgentRoutingPageState();

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Settings className="h-8 w-8" />
            Agent Routing
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure models for agents and categories
          </p>
        </div>

        <Button
          onClick={state.handleSaveAll}
          disabled={state.saving || state.loading}
        >
          {state.saving ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin me-2" />
              Saving...
            </>
          ) : (
            <>
              <Database className="h-4 w-4 me-2" />
              Save All
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="agents">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="agents">Agents</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
          </TabsList>
          <GlobalFallbackSelector
            value={state.globalFallbackModel}
            onValueChange={state.handleSaveGlobalFallback}
          />
        </div>

        <TabsContent value="agents" className="mt-4">
          <AgentRoutingAgentsTab
            loading={state.loading}
            agents={AGENT_DEFINITIONS}
            models={state.models}
            onOpenAgentConfig={state.openAgentConfig}
            onQuickModelChange={state.handleQuickModelChange}
            getAgentConfigInfo={state.getAgentConfigInfo}
          />
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <AgentRoutingCategoriesTab
            loading={state.loading}
            categories={CATEGORY_DEFINITIONS}
            models={state.models}
            onOpenCategoryConfig={state.openCategoryConfig}
            onQuickModelChange={state.handleQuickCategoryModelChange}
            getCategoryConfigInfo={state.getCategoryConfigInfo}
          />
        </TabsContent>
      </Tabs>

      <AgentConfigEditor
        open={state.agentConfigDialogOpen}
        onOpenChange={state.setAgentConfigDialogOpen}
        agentKey={state.editingAgentKey}
        initialConfig={state.resolvedAgentConfigs[state.editingAgentKey]}
        onSave={state.handleSaveAgentConfig}
        saving={state.saving}
        error={state.error}
      />

      <CategoryConfigEditor
        open={state.categoryConfigDialogOpen}
        onOpenChange={state.setCategoryConfigDialogOpen}
        categoryKey={state.editingCategoryKey}
        initialConfig={state.resolvedCategoryConfigs[state.editingCategoryKey]}
        onSave={state.handleSaveCategoryConfig}
        onReset={() =>
          state.handleDeleteCategoryConfig(state.editingCategoryKey)
        }
        saving={state.saving}
        error={state.error}
      />
    </div>
  );
}

export default AgentRoutingPage;
