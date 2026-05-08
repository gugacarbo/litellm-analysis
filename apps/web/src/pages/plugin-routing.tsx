"use client";

import { GitBranch } from "lucide-react";
import { PluginRoutingGrid } from "../components/plugin-routing/plugin-routing-grid";
import { PageLayout } from "../components/ui/page-layout";
import { usePluginRoutingPage } from "./plugin-routing/use-plugin-routing-page";

export function PluginRoutingPage() {
  const state = usePluginRoutingPage();

  return (
    <PageLayout
      title="Plugin Routing"
      subtitle="Configure agent-to-plugin routing"
      icon={GitBranch}
    >
      <PluginRoutingGrid
        plugins={state.plugins}
        loading={state.loading}
        onTogglePlugin={state.handleTogglePlugin}
        onToggleAgent={state.handleToggleAgent}
      />
    </PageLayout>
  );
}
