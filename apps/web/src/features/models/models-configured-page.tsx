import { ModelsTableCard } from "./components/models-table-card";
import { useModelsPage } from "./use-models-page";

export function ModelsConfiguredPage() {
  const {
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
    handleDelete,
    handleOpenCreateWithDefaultProvider,
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
    providers,
    defaultProvider,
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
      onDeleteModelNameChange={setDeleteModelName}
      onDelete={handleDelete}
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
      onOpenCreate={() => handleOpenCreateWithDefaultProvider(defaultProvider)}
      onFormDataChange={setFormData}
      onAddExtraParam={addExtraParam}
      onRemoveExtraParam={removeExtraParam}
      onUpdateExtraParam={updateExtraParam}
      onSubmit={handleSubmit}
      providers={providers}
      defaultProvider={defaultProvider}
      defaultSettingsDriftCount={defaultSettingsDriftCount}
    />
  );
}
