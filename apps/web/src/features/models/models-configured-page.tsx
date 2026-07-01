import { ModelsTableCard } from "./components/models-table-card";
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
    handleExportConfigs,
    syncing,
    exportingConfigs,
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
    defaultSettingsDriftCount,
  } = useModelsPage();

  return (
    <ModelsTableCard
      models={models}
      loading={modelsQuery.isPending && !modelsQuery.data}
      healthChecksByModel={healthChecksByModel}
      getHealthCheck={getHealthCheck}
      healthChecksLoading={
        healthChecksQuery.isPending && !healthChecksQuery.data
      }
      error={
        mutationError || (modelsQuery.error ? String(modelsQuery.error) : null)
      }
      deleteModelName={deleteModelName}
      addToConfigPending={addToConfigPending}
      onDeleteModelNameChange={setDeleteModelName}
      onDelete={handleDelete}
      onAddToConfig={handleAddToConfig}
      onToggleEnabled={handleToggleEnabled}
      counts={counts}
      settingsStorage={"database"}
      syncing={syncing}
      exportingConfigs={exportingConfigs}
      onExportConfigs={() => {
        void handleExportConfigs();
      }}
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
      defaultSettingsDriftCount={defaultSettingsDriftCount}
    />
  );
}
