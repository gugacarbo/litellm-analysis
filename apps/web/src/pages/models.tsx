import { RefreshCw, Settings } from "lucide-react";
import { ModelFormDialog } from "../components/models/model-form-dialog";
import { ModelsTableCard } from "../components/models/models-table-card";
import { Button } from "../components/ui/button";
import { PageLayout } from "../components/ui/page-layout";
import { useModelsPage } from "./models/use-models-page";

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
    modelsHealth,
    modelsQuery,
    mutationError,
    handleAddToConfig,
    handleDelete,
    handleOpenCreateWithDefaultCredential,
    handleSyncFromConfig,
    syncing,
    handleOpenEdit,
    handleSubmit,
    addExtraParam,
    removeExtraParam,
    setDialogOpen,
    setFormData,
    updateExtraParam,
    credentials,
    defaultCredential,
  } = useModelsPage();

  return (
    <PageLayout
      title="Models"
      icon={Settings}
      buttons={
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            className="h-7 px-2 text-xs"
            onClick={() => {
              void handleSyncFromConfig();
            }}
            disabled={syncing || (counts.configOnly === 0 && counts.litellmOnly === 0)}
          >
            <RefreshCw
              className={`mr-1.5 h-3 w-3 ${syncing ? "animate-spin" : ""}`}
            />
            Sync
            {counts.configOnly > 0 ? ` (${counts.configOnly})` : null}
          </Button>
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
      }
    >
      <ModelsTableCard
        models={models}
        loading={modelsQuery.isPending && !modelsQuery.data}
        modelsHealth={modelsHealth}
        error={
          mutationError ||
          (modelsQuery.error ? String(modelsQuery.error) : null)
        }
        deleteModelName={deleteModelName}
        addToConfigPending={addToConfigPending}
        onDeleteModelNameChange={setDeleteModelName}
        onOpenEdit={handleOpenEdit}
        onDelete={handleDelete}
        onAddToConfig={handleAddToConfig}
      />
    </PageLayout>
  );
}
