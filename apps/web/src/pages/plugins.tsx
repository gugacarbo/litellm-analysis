"use client";

import { Settings } from "lucide-react";
import { PluginRoutingGrid } from "../components/plugin-routing/plugin-routing-grid";
import { PageLayout } from "../components/ui/page-layout";
import { usePluginRoutingPage } from "./plugin-routing/use-plugin-routing-page";

export function PluginsPage() {
  const pluginState = usePluginRoutingPage();

  return (
    <PageLayout
      title="Plugins & Routing"
      subtitle="Configure plugin routing and model aliases"
      icon={Settings}
    >
      <PluginRoutingGrid
        plugins={pluginState.plugins}
        loading={pluginState.loading}
        onTogglePlugin={pluginState.handleTogglePlugin}
        onToggleAgent={pluginState.handleToggleAgent}
      />
    </PageLayout>
  );
}
