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
    providerError,
    providerLoading,
    providerSaving,
    providerDefaultCredential,
    handleProviderDefaultCredentialChange,
    openAiOAuthConnection,
    openAiOAuthPending,
    openAiOAuthDeviceFlow,
    openAiOAuthLoading,
    openAiOAuthBusy,
    openAiOAuthError,
    handleStartOpenAiOAuth,
    handleCancelOpenAiOAuth,
    handleDisconnectOpenAiOAuth,
    defaultSettingsDriftCount,
    defaultSettingsMismatchedModels,
    defaultSettingsLoading,
    syncingDefaultSettings,
    handleSyncDefaultSettings,
    credentialFormOpen,
    setCredentialFormOpen,
    editingCredential,
    credentialFormData,
    setCredentialFormData,
    credentialFormError,
    credentialFormLoading,
    handleOpenCreateCredential,
    handleOpenEditCredential,
    handleCredentialFormSubmit,
    handleDeleteCredential,
    deleteCredentialLoading,
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
        providerLoading={providerLoading}
        providerSaving={providerSaving}
        providerDefaultCredential={providerDefaultCredential}
        onProviderDefaultCredentialChange={
          handleProviderDefaultCredentialChange
        }
        openAiOAuthConnection={openAiOAuthConnection}
        openAiOAuthPending={openAiOAuthPending}
        openAiOAuthDeviceFlow={openAiOAuthDeviceFlow}
        openAiOAuthLoading={openAiOAuthLoading}
        openAiOAuthBusy={openAiOAuthBusy}
        openAiOAuthError={openAiOAuthError}
        onStartOpenAiOAuth={() => {
          void handleStartOpenAiOAuth();
        }}
        onCancelOpenAiOAuth={handleCancelOpenAiOAuth}
        onDisconnectOpenAiOAuth={() => {
          void handleDisconnectOpenAiOAuth();
        }}
        defaultSettingsDriftCount={defaultSettingsDriftCount}
        defaultSettingsMismatchedModels={defaultSettingsMismatchedModels}
        defaultSettingsLoading={defaultSettingsLoading}
        syncingDefaultSettings={syncingDefaultSettings}
        onSyncDefaultSettings={() => {
          void handleSyncDefaultSettings();
        }}
        credentialFormOpen={credentialFormOpen}
        setCredentialFormOpen={setCredentialFormOpen}
        editingCredential={editingCredential}
        credentialFormData={credentialFormData}
        setCredentialFormData={setCredentialFormData}
        credentialFormError={credentialFormError}
        credentialFormLoading={credentialFormLoading}
        onOpenCreateCredential={handleOpenCreateCredential}
        onOpenEditCredential={handleOpenEditCredential}
        onCredentialFormSubmit={() => {
          void handleCredentialFormSubmit();
        }}
        onDeleteCredential={(name) => {
          void handleDeleteCredential(name);
        }}
        deleteCredentialLoading={deleteCredentialLoading}
      />
    </>
  );
}
