import {
  AlertTriangle,
  ArrowLeft,
  Check,
  Copy,
  Plug,
  Save,
  Settings,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { JsonSchemaForm } from "@/shared/components/json-schema-form";
import { Button } from "@/shared/components/ui/button";
import { PageLayout } from "@/shared/components/ui/page-layout";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { AgentMappingTable } from "./components/agent-mapping-table";
import { CategoryExportList } from "./components/category-export-list";
import { ModelAliasRoutingTable } from "./components/model-alias-routing-table";
import { PluginConfigForm } from "./components/plugin-config-form";
import { OpenCodeConfigPage } from "./opencode-config";
import { usePluginConfigPage } from "./use-plugin-config-page";
import { WeaveConfigPage } from "./weave-config";

export function PluginConfigPage() {
  const { pluginId } = useParams() as { pluginId?: string };
  const navigate = useNavigate();
  const state = usePluginConfigPage(pluginId ?? "");
  const [copied, setCopied] = useState(false);

  const showAliasRouting = state.pluginId === "model-alias";
  const showAgentsTab = !showAliasRouting && state.internalAgents.length > 0;
  const showCategoriesTab = !showAliasRouting && state.categories.length > 0;
  const showPreviewTab =
    state.pluginId !== "weave" && state.pluginId !== "opencode";

  const previewPayload = useMemo(() => {
    const payload: Record<string, unknown> = {
      config: state.configValues,
    };

    if (Object.keys(state.agentMappings).length > 0) {
      payload.agentMappings = state.agentMappings;
    }

    if (Object.keys(state.categoryMappings).length > 0) {
      payload.categoryMappings = state.categoryMappings;
    }

    return payload;
  }, [state.configValues, state.agentMappings, state.categoryMappings]);

  const previewText = useMemo(
    () => JSON.stringify(previewPayload, null, 2),
    [previewPayload],
  );

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(previewText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [previewText]);

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
          {state.pluginId === "weave" ? (
            <WeaveConfigPage
              config={state.configValues}
              onChange={state.handleConfigChange}
              schema={state.schema}
              agentMappings={state.agentMappings}
              categoryMappings={state.categoryMappings}
              systemAgents={state.systemAgents}
              onAgentMappingChange={state.handleAgentMappingChange}
              onCategoryToggle={state.handleCategoryToggle}
            />
          ) : (
            <Tabs defaultValue="settings">
              <TabsList variant="line" className="mb-4">
                <TabsTrigger value="settings">Settings</TabsTrigger>
                {showAliasRouting ? (
                  <TabsTrigger value="routing">Alias Routing</TabsTrigger>
                ) : (
                  <>
                    {showAgentsTab && (
                      <TabsTrigger value="agents">Agent Mapping</TabsTrigger>
                    )}
                    {showCategoriesTab && (
                      <TabsTrigger value="categories">
                        Category Export
                      </TabsTrigger>
                    )}
                  </>
                )}
                {showPreviewTab && (
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="settings">
                {state.pluginId === "opencode" ? (
                  <OpenCodeConfigPage
                    config={state.configValues}
                    onChange={state.handleConfigChange}
                    allModels={state.allModels}
                    modelProxyProvider={state.modelProxyProvider}
                  />
                ) : state.jsonSchema ? (
                  <div className="space-y-4">
                    <JsonSchemaForm
                      schema={state.jsonSchema}
                      formData={state.configValues}
                      onChange={(data) => {
                        if (!data.formData) return;
                        for (const [key, value] of Object.entries(
                          data.formData,
                        )) {
                          state.handleConfigChange(key, value);
                        }
                      }}
                    />
                  </div>
                ) : (
                  <PluginConfigForm
                    schema={state.schema}
                    values={state.configValues}
                    onChange={state.handleConfigChange}
                  />
                )}
              </TabsContent>

              {showAliasRouting ? (
                <TabsContent value="routing">
                  <ModelAliasRoutingTable
                    systemAgents={state.systemAgents}
                    categoryOptions={state.categoryOptions}
                    agentMappings={state.agentMappings}
                    categoryMappings={state.categoryMappings}
                    configValues={state.configValues}
                    onAgentMappingChange={state.handleAgentMappingChange}
                    onCategoryToggle={state.handleCategoryToggle}
                  />
                </TabsContent>
              ) : (
                <>
                  {showAgentsTab && (
                    <TabsContent value="agents">
                      <AgentMappingTable
                        internalAgents={state.internalAgents}
                        mappings={state.agentMappings}
                        systemAgents={state.systemAgents}
                        onChange={state.handleAgentMappingChange}
                      />
                    </TabsContent>
                  )}
                  {showCategoriesTab && (
                    <TabsContent value="categories">
                      <CategoryExportList
                        categories={state.categories}
                        mappings={state.categoryMappings}
                        onToggle={state.handleCategoryToggle}
                      />
                    </TabsContent>
                  )}
                </>
              )}

              {showPreviewTab && (
                <TabsContent value="preview">
                  <section className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-medium">JSON Preview</h3>
                        <p className="text-sm text-muted-foreground">
                          Snapshot of the plugin config and mappings.
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleCopy}>
                        {copied ? (
                          <Check className="mr-2 h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="mr-2 h-4 w-4" />
                        )}
                        {copied ? "Copied" : "Copy"}
                      </Button>
                    </div>
                    <div className="rounded-md border bg-muted/20">
                      <pre className="max-h-80 overflow-auto p-4 text-xs font-mono">
                        {previewText}
                      </pre>
                    </div>
                  </section>
                </TabsContent>
              )}
            </Tabs>
          )}
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
          <div
            key={i}
            className="flex items-center justify-between rounded-md border px-3 py-2"
          >
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
          <div
            key={i}
            className="flex items-center justify-between rounded-md border px-3 py-2"
          >
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-9 rounded-full" />
          </div>
        ))}
      </div>
    </>
  );
}
