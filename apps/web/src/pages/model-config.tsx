import { Settings } from "lucide-react";
import { useParams } from "react-router-dom";
import { ModelConfigForm } from "../components/models/model-config-form";
import { PageLayout } from "../components/ui/page-layout";
import { Skeleton } from "../components/ui/skeleton";
import { useModelConfigPage } from "./model-config/use-model-config-page";

export function ModelConfigPage() {
  const { modelName } = useParams() as { modelName: string };
  const {
    model,
    loading,
    error,
    notFound,
    formData,
    isDirty,
    saving,
    credentials,
    onFormDataChange,
    onAddExtraParam,
    onRemoveExtraParam,
    onUpdateExtraParam,
    onSave,
    onBack,
  } = useModelConfigPage();

  if (loading) {
    return (
      <PageLayout title="Loading..." icon={Settings}>
        <div className="space-y-6 p-2">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout
        title="Error"
        icon={Settings}
        buttons={
          <button
            onClick={onBack}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Back to Models
          </button>
        }
      >
        <div className="flex items-center justify-center py-16">
          <p className="text-destructive">{error}</p>
        </div>
      </PageLayout>
    );
  }

  if (notFound) {
    return (
      <PageLayout
        title={`Model: ${modelName}`}
        icon={Settings}
        buttons={
          <button
            onClick={onBack}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Back to Models
          </button>
        }
      >
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <Settings className="mb-3 h-10 w-10 stroke-1 text-muted-foreground opacity-40" />
          <h3 className="text-lg font-medium text-muted-foreground">
            Model not found
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            The model &quot;{modelName}&quot; does not exist.
          </p>
        </div>
      </PageLayout>
    );
  }

  if (!model) {
    return null;
  }

  return (
    <PageLayout
      title={model.modelName}
      subtitle="Configure model settings and database parameters"
      icon={Settings}
    >
      <ModelConfigForm
        modelName={model.modelName}
        formData={formData}
        credentials={credentials}
        onFormDataChange={onFormDataChange}
        onAddExtraParam={onAddExtraParam}
        onRemoveExtraParam={onRemoveExtraParam}
        onUpdateExtraParam={onUpdateExtraParam}
        onSave={onSave}
        onBack={onBack}
        saving={saving}
        isDirty={isDirty}
      />
    </PageLayout>
  );
}
