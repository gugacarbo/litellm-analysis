'use client';

import { Database, RefreshCw, Settings } from 'lucide-react';
import { AgentConfigEditor } from '../components/agent-config-editor';
import { AgentRoutingAgentsTab } from '../components/agent-routing/agent-routing-agents-tab';
import { Button } from '../components/button';
import { CategoryConfigEditor } from '../components/category-config-editor';
import { FeatureGate } from '../components/feature-gate';
import {
  AGENT_DEFINITIONS,
  CATEGORY_DEFINITIONS,
} from '../types/agent-routing';
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
            Visual overview of configured models across agents and categories
          </p>
        </div>

        <FeatureGate capability="agentRouting">
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
        </FeatureGate>
      </div>

      <AgentRoutingAgentsTab
        loading={state.loading}
        saving={state.saving}
        categoriesVisible={state.categoriesVisible}
        agents={AGENT_DEFINITIONS}
        categories={CATEGORY_DEFINITIONS}
        onToggleCategories={() => state.setCategoriesVisible((prev) => !prev)}
        onOpenAgentConfig={state.openAgentConfig}
        onDeleteAgentConfig={state.handleDeleteAgentConfig}
        onOpenCategoryConfig={state.openCategoryConfig}
        onDeleteCategoryConfig={state.handleDeleteCategoryConfig}
        getAgentConfigInfo={state.getAgentConfigInfo}
        getCategoryConfigInfo={state.getCategoryConfigInfo}
      />

      <AgentConfigEditor
        open={state.agentConfigDialogOpen}
        onOpenChange={state.setAgentConfigDialogOpen}
        agentKey={state.editingAgentKey}
        initialConfig={state.resolvedAgentConfigs[state.editingAgentKey]}
        onSave={state.handleSaveAgentConfig}
        onReset={() => state.handleDeleteAgentConfig(state.editingAgentKey)}
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
