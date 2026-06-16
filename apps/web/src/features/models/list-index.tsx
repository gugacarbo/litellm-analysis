import { Database, HeartPulse } from "lucide-react";
import { useState } from "react";
import { HealthStatusContent } from "@/features/monitor/components/health-status-content";
import { PageLayout } from "@/shared/components/ui/page-layout";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { ModelsTableCard } from "./components/models-table-card";
import { SyncModelsDialog } from "./components/sync-models-dialog";
import { useModelsPage } from "./use-models-page";

export function ModelsPage() {
  const [activeTab, setActiveTab] = useState("models");

  const {
    addToConfigPending,
    counts,
    deleteModelName,
    setDeleteModelName,
    dialogOpen,
    editingModel,
    formData,
    formError,
    formLoading,
    models,
    healthChecksByModel,
    getHealthCheck,
    modelsQuery,
    healthChecksQuery,
    mutationError,
    handleAddToConfig,
    handleDelete,
    handleOpenCreateWithDefaultCredential,
    handleOpenSync,
    handleApplySyncSelections,
    handleSyncSelectionChange,
    syncing,
    syncDialogOpen,
    setSyncDialogOpen,
    syncDiffItems,
    syncDiffLoading,
    syncSelections,
    handleToggleEnabled,
    handleSubmit,
    addExtraParam,
    removeExtraParam,
    setDialogOpen,
    setFormData,
    updateExtraParam,
    credentials,
    defaultCredential,
    providerError,
    providerLoading,
    providerSaving,
    providerDefaultCredential,
    handleProviderDefaultCredentialChange,
    defaultSettingsDriftCount,
    defaultSettingsMismatchedModels,
    defaultSettingsLoading,
    syncingDefaultSettings,
    handleSyncDefaultSettings,
  } = useModelsPage();

  return (
    <PageLayout>
      {providerError ? (
        <p className="text-sm text-destructive">{providerError}</p>
      ) : null}
      <div className="pt-2">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <TabsList variant="line">
              <TabsTrigger value="models" className="gap-1.5">
                <Database className="size-3.5" />
                Configured Models
              </TabsTrigger>
              <TabsTrigger value="health-check" className="gap-1.5">
                <HeartPulse className="size-3.5" />
                Health Check
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="models">
            <ModelsTableCard
              models={models}
              loading={modelsQuery.isPending && !modelsQuery.data}
              healthChecksByModel={healthChecksByModel}
              getHealthCheck={getHealthCheck}
              healthChecksLoading={
                healthChecksQuery.isPending && !healthChecksQuery.data
              }
              error={
                mutationError ||
                (modelsQuery.error ? String(modelsQuery.error) : null)
              }
              deleteModelName={deleteModelName}
              addToConfigPending={addToConfigPending}
              onDeleteModelNameChange={setDeleteModelName}
              onDelete={handleDelete}
              onAddToConfig={handleAddToConfig}
              onToggleEnabled={handleToggleEnabled}
              counts={counts}
              syncing={syncing}
              syncDialogOpen={syncDialogOpen}
              setSyncDialogOpen={setSyncDialogOpen}
              syncDiffItems={syncDiffItems}
              syncDiffLoading={syncDiffLoading}
              syncSelections={syncSelections}
              onSyncSelectionChange={handleSyncSelectionChange}
              onApplySync={() => {
                void handleApplySyncSelections();
              }}
              onOpenSync={() => {
                void handleOpenSync();
              }}
              dialogOpen={dialogOpen}
              setDialogOpen={setDialogOpen}
              editingModel={editingModel}
              formData={formData}
              formError={formError}
              formLoading={formLoading}
              onOpenCreate={() =>
                handleOpenCreateWithDefaultCredential(defaultCredential)
              }
              onFormDataChange={setFormData}
              onAddExtraParam={addExtraParam}
              onRemoveExtraParam={removeExtraParam}
              onUpdateExtraParam={updateExtraParam}
              onSubmit={handleSubmit}
              credentials={credentials}
              defaultCredential={defaultCredential}
              providerLoading={providerLoading}
              providerSaving={providerSaving}
              providerDefaultCredential={providerDefaultCredential}
              onProviderDefaultCredentialChange={
                handleProviderDefaultCredentialChange
              }
              defaultSettingsDriftCount={defaultSettingsDriftCount}
              defaultSettingsMismatchedModels={defaultSettingsMismatchedModels}
              defaultSettingsLoading={defaultSettingsLoading}
              syncingDefaultSettings={syncingDefaultSettings}
              onSyncDefaultSettings={() => {
                void handleSyncDefaultSettings();
              }}
            />
          </TabsContent>

          <TabsContent value="health-check">
            <HealthStatusContent embedded />
          </TabsContent>
        </Tabs>
      </div>
      <SyncModelsDialog
        open={syncDialogOpen}
        onOpenChange={setSyncDialogOpen}
        loading={syncDiffLoading}
        applying={syncing}
        items={syncDiffItems}
        selections={syncSelections}
        onSelectionChange={handleSyncSelectionChange}
        onApply={() => {
          void handleApplySyncSelections();
        }}
      />
    </PageLayout>
  );
}
