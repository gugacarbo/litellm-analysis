import { ArrowLeft, Save, Settings } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { AgentMappingTable } from "../components/plugin-routing/agent-mapping-table";
import { CategoryExportList } from "../components/plugin-routing/category-export-list";
import { PluginConfigForm } from "../components/plugin-routing/plugin-config-form";
import { Button } from "../components/ui/button";
import { PageLayout } from "../components/ui/page-layout";
import { usePluginConfigPage } from "./plugin-config/use-plugin-config-page";

export function PluginConfigPage() {
  const { pluginId } = useParams() as { pluginId?: string };
  const navigate = useNavigate();
  const state = usePluginConfigPage(pluginId ?? "");

  return (
    <PageLayout
      title={pluginId ?? "Plugin Config"}
      subtitle="Configure plugin settings, agent routing, and category exports"
      icon={Settings}
      buttons={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/plugins")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button onClick={state.handleSave} disabled={state.saving}>
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
        </div>
      }
    >
      {state.loading ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : state.error ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-destructive">{state.error}</p>
        </div>
      ) : (
        <div className="space-y-8 p-2">
          <PluginConfigForm
            schema={state.schema}
            values={state.configValues}
            onChange={state.handleConfigChange}
          />
          <AgentMappingTable
            internalAgents={state.internalAgents}
            mappings={state.agentMappings}
            onChange={state.handleAgentMappingChange}
          />
          <CategoryExportList
            categories={state.categories}
            mappings={state.categoryMappings}
            onToggle={state.handleCategoryToggle}
          />
        </div>
      )}
    </PageLayout>
  );
}
