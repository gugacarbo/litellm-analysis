import { AlertTriangle, ArrowLeft, Plug, Save, Settings } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { AgentMappingTable } from "../components/plugin-routing/agent-mapping-table";
import { CategoryExportList } from "../components/plugin-routing/category-export-list";
import { PluginConfigForm } from "../components/plugin-routing/plugin-config-form";
import { Button } from "../components/ui/button";
import { PageLayout } from "../components/ui/page-layout";
import { Skeleton } from "../components/ui/skeleton";
import { usePluginConfigPage } from "./plugin-config/use-plugin-config-page";

export function PluginConfigPage() {
  const { pluginId } = useParams() as { pluginId?: string };
  const navigate = useNavigate();
  const state = usePluginConfigPage(pluginId ?? "");

  const title = state.pluginName ?? pluginId ?? "Plugin Config";

  return (
    <PageLayout
      title={title}
      subtitle="Configure plugin settings, agent routing, and category exports"
      icon={Settings}
      buttons={
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/plugins")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <Button
            onClick={state.handleSave}
            disabled={state.saving || !state.isDirty}
          >
            <Save className="mr-2 h-4 w-4" />
            {state.saving ? "Saving..." : "Save"}
          </Button>
        </div>
      }
    >
      {state.loading ? (
        <div className="space-y-8 p-2">
          <ConfigSkeleton />
        </div>
      ) : state.notFound ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <Plug className="mb-3 h-10 w-10 stroke-1 text-muted-foreground opacity-40" />
          <h3 className="text-lg font-medium text-muted-foreground">
            Plugin not found
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            The plugin "{pluginId}" is not registered.
          </p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => navigate("/plugins")}
          >
            Back to plugins
          </Button>
        </div>
      ) : state.error ? (
        <div className="flex items-center justify-center py-16">
          <p className="text-destructive">{state.error}</p>
        </div>
      ) : (
        <div className="space-y-8 p-2">
          {state.isDirty && (
            <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
              <AlertTriangle className="h-4 w-4" />
              You have unsaved changes.
            </div>
          )}
          <PluginConfigForm
            schema={state.schema}
            values={state.configValues}
            onChange={state.handleConfigChange}
          />
          <AgentMappingTable
            internalAgents={state.internalAgents}
            mappings={state.agentMappings}
            systemAgents={state.systemAgents}
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

function ConfigSkeleton() {
  return (
    <>
      <div className="space-y-4">
        <Skeleton className="h-6 w-36" />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-8 w-full" />
          </div>
        </div>
      </div>
      <div className="space-y-4">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-4 w-72" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between rounded-md border px-3 py-2">
            <div className="space-y-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-48" />
            </div>
            <Skeleton className="h-8 w-40" />
          </div>
        ))}
      </div>
      <div className="space-y-4">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-4 w-64" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between rounded-md border px-3 py-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-9 rounded-full" />
          </div>
        ))}
      </div>
    </>
  );
}
