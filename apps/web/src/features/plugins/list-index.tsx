"use client";

import { Settings } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { PageLayout } from "@/shared/components/ui/page-layout";
import { PluginRoutingGrid } from "./components/plugin-routing-grid";
import { usePluginRoutingPage } from "./use-plugin-routing-page";

export function PluginsPage() {
  const pluginState = usePluginRoutingPage();

  return (
    <PageLayout
      title="Plugins & Routing"
      subtitle="Configure plugin routing and model aliases"
      icon={Settings}
      buttons={
        <Button
          onClick={pluginState.handleSave}
          disabled={pluginState.saving || pluginState.loading}
        >
          {pluginState.saving ? "Saving..." : "Save"}
        </Button>
      }
    >
      <PluginRoutingGrid
        plugins={pluginState.plugins}
        loading={pluginState.loading}
        onTogglePlugin={pluginState.handleTogglePlugin}
      />
    </PageLayout>
  );
}
