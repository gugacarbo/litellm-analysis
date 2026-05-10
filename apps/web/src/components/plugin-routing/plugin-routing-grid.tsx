import { Plug } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import { PluginCard } from "./plugin-card";
import type { PluginRoutingGridProps } from "./plugin-routing-types";

export function PluginRoutingGrid({
  plugins,
  loading,
  onTogglePlugin,
}: PluginRoutingGridProps) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="rounded-xl border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-5 w-28" />
              </div>
              <Skeleton className="h-5 w-9 rounded-full" />
            </div>
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-9 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (plugins.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
        <Plug className="mb-3 h-10 w-10 stroke-1 text-muted-foreground opacity-40" />
        <h3 className="text-lg font-medium text-muted-foreground">
          No plugins
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          No plugin routing configurations found.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {plugins.map((plugin) => (
        <PluginCard
          key={plugin.id}
          plugin={plugin}
          onToggle={onTogglePlugin}
        />
      ))}
    </div>
  );
}
