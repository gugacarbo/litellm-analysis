"use client";

import { Bot } from "lucide-react";
import { AgentCatalogForm } from "../components/agent-catalog/agent-catalog-form";
import { AgentCatalogGrid } from "../components/agent-catalog/agent-catalog-grid";
import { PageLayout } from "../components/ui/page-layout";
import { useAgentCatalogPage } from "./agent-catalog/use-agent-catalog-page";

export function AgentCatalogPage() {
  const state = useAgentCatalogPage();

  return (
    <PageLayout
      title="Agent Catalog"
      subtitle="Manage system agents"
      icon={Bot}
    >
      <AgentCatalogGrid
        agents={state.agents}
        loading={state.loading}
        onEdit={state.openEditForm}
        onDelete={state.handleDelete}
        onCreate={state.openCreateForm}
      />
      <AgentCatalogForm
        agent={state.editingAgent}
        open={state.formOpen}
        onOpenChange={(open) => {
          if (!open) state.closeForm();
        }}
        onSubmit={state.editingAgent ? state.handleUpdate : state.handleCreate}
      />
    </PageLayout>
  );
}
