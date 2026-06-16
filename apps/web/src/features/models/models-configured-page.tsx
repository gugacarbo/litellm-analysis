import { ModelsTableCard } from "./components/models-table-card";
import { SyncModelsDialog } from "./components/sync-models-dialog";
import { useModelsPage } from "./use-models-page";

export function ModelsConfiguredPage() {
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
    <>
      {providerError ? (
        <p className="text-sm text-destructive">{providerError}</p>
      ) : null}
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
    </>
  );
}
