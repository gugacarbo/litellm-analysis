'use client';

import { Database, RefreshCw, Settings } from 'lucide-react';
import { AgentConfigEditor } from '../components/agent-config-editor';
import { AgentRoutingAgentsTab } from '../components/agent-routing/agent-routing-agents-tab';
import { AgentRoutingAliasDialog } from '../components/agent-routing/agent-routing-alias-dialog';
import { AgentRoutingAliasesTab } from '../components/agent-routing/agent-routing-aliases-tab';
import { Button } from '../components/button';
import { CategoryConfigEditor } from '../components/category-config-editor';
import { FeatureGate } from '../components/feature-gate';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/tabs';
import { AGENT_DEFINITIONS, CATEGORY_DEFINITIONS } from '../types/agent-routing';
import { useAgentRoutingPageState } from './agent-routing/use-agent-routing-page';

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
            Configure which models are assigned to each agent and category
          </p>
        </div>

        <FeatureGate capability="agentConfigFile">
          <Button onClick={state.handleSaveAll} disabled={state.saving || state.loading}>
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
        </FeatureGate>
      </div>

      <Tabs defaultValue="agents">
        <TabsList>
          <TabsTrigger value="agents">Agents & Categories</TabsTrigger>
          <TabsTrigger value="aliases">Custom Aliases</TabsTrigger>
        </TabsList>

        <TabsContent value="agents">
          <AgentRoutingAgentsTab
            loading={state.loading}
            error={state.error}
            saving={state.saving}
            categoriesVisible={state.categoriesVisible}
            agents={AGENT_DEFINITIONS}
            categories={CATEGORY_DEFINITIONS}
            onToggleCategories={() =>
              state.setCategoriesVisible((prev) => !prev)
            }
            onOpenAgentConfig={state.openAgentConfig}
            onDeleteAgentConfig={state.handleDeleteAgentConfig}
            onOpenCategoryConfig={state.openCategoryConfig}
            onDeleteCategoryConfig={state.handleDeleteCategoryConfig}
            getAgentConfigInfo={state.getAgentConfigInfo}
            getCategoryConfigInfo={state.getCategoryConfigInfo}
          />
        </TabsContent>

        <TabsContent value="aliases">
          <AgentRoutingAliasesTab
            loading={state.loading}
            saving={state.saving}
            customAliases={state.customAliases}
            onOpenAddAlias={state.openAddAlias}
            onOpenEditAlias={state.openEditAlias}
            onDeleteAlias={state.handleAliasDelete}
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
        saving={state.saving}
        error={state.error}
      />

      <AgentRoutingAliasDialog
        open={state.aliasDialogOpen}
        mode={state.aliasDialogMode}
        saving={state.saving}
        aliasKey={state.aliasDialogKey}
        aliasValue={state.aliasDialogValue}
        onOpenChange={state.setAliasDialogOpen}
        onAliasKeyChange={state.setAliasDialogKey}
        onAliasValueChange={state.setAliasDialogValue}
        onSave={state.handleAliasSave}
      />
    </div>
  );
}

export default AgentRoutingPage;
