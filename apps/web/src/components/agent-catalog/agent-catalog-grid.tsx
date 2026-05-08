import { Plus } from "lucide-react";
import { Button } from "../ui/button";
import { Skeleton } from "../ui/skeleton";
import { AgentCatalogCard } from "./agent-catalog-card";
import type { AgentCatalogGridProps } from "./agent-catalog-types";

export function AgentCatalogGrid({
  agents,
  loading,
  onEdit,
  onDelete,
  onCreate,
}: AgentCatalogGridProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Agent Catalog</h2>
        <Button onClick={onCreate}>
          <Plus className="h-4 w-4 mr-2" />
          New Agent
        </Button>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="rounded-xl border p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-24" />
              <div className="flex gap-1">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Skeleton className="h-9 w-16" />
                <Skeleton className="h-9 w-16" />
              </div>
            </div>
          ))}
        </div>
      ) : agents.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <h3 className="text-lg font-medium text-muted-foreground">
            No agents
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Get started by creating your first agent.
          </p>
          <Button className="mt-4" onClick={onCreate}>
            <Plus className="h-4 w-4 mr-2" />
            New Agent
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => (
            <AgentCatalogCard
              key={agent.id}
              agent={agent}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
