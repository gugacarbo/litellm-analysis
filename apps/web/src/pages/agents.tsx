"use client";

import { Database, RefreshCw, Settings } from "lucide-react";
import { AgentConfigEditor } from "../components/agent-config-editor";
import { AgentRoutingAgentsTab } from "../components/agent-routing/agent-routing-agents-tab";
import { AgentRoutingCategoriesTab } from "../components/agent-routing/agent-routing-categories-tab";
import { CategoryConfigEditor } from "../components/category-config-editor";
import { GlobalFallbackSelector } from "../components/global-fallback-selector";
import { Button } from "../components/ui/button";
import { Label } from "../components/ui/label";
import { PageLayout } from "../components/ui/page-layout";
import { Switch } from "../components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { useAgentRoutingPageState } from "./agents/use-agent-routing-page";
export function AgentsPage() {
  const state = useAgentRoutingPageState();

  return (
    <PageLayout
      title="Agent Config"
      subtitle="Configure models for agents and categories"
      icon={Settings}
      buttons={
        <>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <TooltipProvider>
                {" "}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 cursor-pointer">
                      <Switch
                        id="sync-aliases"
                        checked={state.syncAliases}
                        onCheckedChange={state.handleToggleSyncAliases}
                      />
                      <Label
                        htmlFor="sync-aliases"
                        className="text-sm cursor-pointer"
                      >
                        Sync Aliases
                      </Label>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="max-w-48 text-xs">
                      Quando desativado, alterações em agentes e categorias não
                      geram mudanças nos aliases do LiteLLM
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <GlobalFallbackSelector
              value={state.globalFallbackModel}
              onValueChange={state.handleSaveGlobalFallback}
            />
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
        </>
      }
    >
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
            agents={state.agents}
            models={state.models}
            onOpenAgentConfig={state.openAgentConfig}
            onQuickModelChange={state.handleQuickModelChange}
            getAgentConfigInfo={state.getAgentConfigInfo}
          />
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <AgentRoutingCategoriesTab
            loading={state.loading}
            categories={state.categories}
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
    </PageLayout>
  );
}

export default AgentsPage;
