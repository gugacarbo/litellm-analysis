import { RefreshCw, Settings } from "lucide-react";
import { useState } from "react";
import { HealthStatusContent } from "@/features/monitor/components/health-status-content";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/shared/components/ui/dialog";
import { PageLayout } from "@/shared/components/ui/page-layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import { ModelFormDialog } from "./components/model-form-dialog";
import { ModelsTableCard } from "./components/models-table-card";
import { SyncModelsDialog } from "./components/sync-models-dialog";
import { useModelsPage } from "./use-models-page";

export function ModelsPage() {
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
    providerLoading,
    providerSaving,
    providerError,
    providerDefaultCredential,
    handleProviderDefaultCredentialChange,
    defaultSettingsDriftCount,
    defaultSettingsMismatchedModels,
    defaultSettingsLoading,
    syncingDefaultSettings,
    handleSyncDefaultSettings,
  } = useModelsPage();
  const [credentialsDialogOpen, setCredentialsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("configured-models");

  return (
    <PageLayout
      title="Models"
      icon={Settings}
      buttons={
        activeTab === "configured-models" ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => {
                void handleOpenSync();
              }}
              disabled={syncing}
            >
              <RefreshCw
                className={`mr-1.5 h-3 w-3 ${syncing ? "animate-spin" : ""}`}
              />
              Sync
              {counts.configOnly + defaultSettingsDriftCount > 0
                ? ` (${counts.configOnly + defaultSettingsDriftCount})`
                : null}
            </Button>
            <Dialog
              open={credentialsDialogOpen}
              onOpenChange={setCredentialsDialogOpen}
            >
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                >
                  Credentials
                  {defaultSettingsDriftCount > 0
                    ? ` (${defaultSettingsDriftCount})`
                    : null}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                  <DialogTitle>Credentials</DialogTitle>
                  <DialogDescription>
                    Defina a credencial padrão e sincronize os modelos fora do
                    padrão.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Default credential</p>
                    <Select
                      value={providerDefaultCredential || "none"}
                      onValueChange={(value) => {
                        void handleProviderDefaultCredentialChange(
                          value === "none" ? "" : value,
                        );
                      }}
                      disabled={providerLoading || providerSaving}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Default credential" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">
                          Sem credencial padrão
                        </SelectItem>
                        {credentials.map((credential) => (
                          <SelectItem
                            key={credential.credentialId}
                            value={credential.credentialName}
                          >
                            {credential.credentialName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Modelos fora da credencial padrão
                    </p>
                    {defaultSettingsLoading ? (
                      <p className="text-sm text-muted-foreground">
                        Carregando...
                      </p>
                    ) : defaultSettingsMismatchedModels.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Todos os modelos já estão com a credencial padrão.
                      </p>
                    ) : (
                      <div className="max-h-48 overflow-auto rounded-md border p-2">
                        <ul className="space-y-1 text-sm">
                          {defaultSettingsMismatchedModels.map((modelName) => (
                            <li key={modelName} className="font-mono">
                              {modelName}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setCredentialsDialogOpen(false)}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      void handleSyncDefaultSettings();
                    }}
                    disabled={
                      syncingDefaultSettings || defaultSettingsDriftCount === 0
                    }
                  >
                    <RefreshCw
                      className={`mr-1.5 h-3 w-3 ${
                        syncingDefaultSettings ? "animate-spin" : ""
                      }`}
                    />
                    Sync default settings
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <ModelFormDialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              editingModel={editingModel}
              formLoading={formLoading}
              formError={formError}
              formData={formData}
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
            />
          </div>
        ) : null
      }
    >
      {providerError ? (
        <p className="text-sm text-destructive">{providerError}</p>
      ) : null}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="gap-4">
        <TabsList variant="line">
          <TabsTrigger value="configured-models">Configured models</TabsTrigger>
          <TabsTrigger value="health-check">Health check</TabsTrigger>
        </TabsList>

        <TabsContent value="configured-models" className="space-y-4">
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
          />
        </TabsContent>

        <TabsContent value="health-check">
          <HealthStatusContent embedded />
        </TabsContent>
      </Tabs>
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
