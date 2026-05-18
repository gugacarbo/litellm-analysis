"use client";

import { Settings } from "lucide-react";
import { useParams } from "react-router-dom";
import { PageLayout } from "../../components/ui/page-layout";
import { Skeleton } from "../../components/ui/skeleton";
import { AgentConfigForm } from "./components/agent-config-form";
import { useAgentConfigPage } from "./use-agent-config-page";

export function AgentConfigPage() {
  const { id } = useParams() as { id: string };
  const {
    loading,
    error,
    notFound,
    formData,
    isDirty,
    saving,
    onFormDataChange,
    onSave,
    onBack,
    isNew,
  } = useAgentConfigPage();

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
            type="button"
            onClick={onBack}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Back to Agents
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
        title={`Agent: ${id}`}
        icon={Settings}
        buttons={
          <button
            type="button"
            onClick={onBack}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Back to Agents
          </button>
        }
      >
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <Settings className="mb-3 h-10 w-10 stroke-1 text-muted-foreground opacity-40" />
          <h3 className="text-lg font-medium text-muted-foreground">
            Agent not found
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            The agent &quot;{id}&quot; does not exist.
          </p>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={isNew ? "New Agent" : formData.displayName || id}
      subtitle={
        isNew ? "Create a new agent configuration" : "Configure agent settings"
      }
      icon={Settings}
    >
      <AgentConfigForm
        formData={formData}
        onFormDataChange={onFormDataChange}
        onSave={onSave}
        onBack={onBack}
        saving={saving}
        isDirty={isDirty}
        isNew={isNew}
      />
    </PageLayout>
  );
}
