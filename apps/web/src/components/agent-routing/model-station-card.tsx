import { ChevronRight, Palette } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { getModelColor } from "./model-stations-utils";

export type EntityItem = {
  key: string;
  name: string;
  icon?: string;
};

export type ModelStationCardProps = {
  modelName: string;
  entities: EntityItem[];
  totalFallbacks: number;
  onOpenEntityConfig: (key: string) => void;
};

const MAX_VISIBLE_ENTITIES = 4;

export function ModelStationCard({
  modelName,
  entities,
  totalFallbacks,
  onOpenEntityConfig,
}: ModelStationCardProps) {
  const color = getModelColor(modelName);
  const visibleEntities = entities.slice(0, MAX_VISIBLE_ENTITIES);
  const remainingCount = entities.length - MAX_VISIBLE_ENTITIES;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border transition-all duration-200 hover:shadow-md",
        color.bg,
        color.border,
      )}
    >
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-20" />

      <div className="p-4">
        <div className="mb-3 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className={cn("size-2 shrink-0 rounded-full", color.dot)} />
              <p
                className={cn(
                  "truncate font-mono text-sm font-semibold",
                  color.text,
                )}
              >
                {modelName}
              </p>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {entities.length} {entities.length === 1 ? "entity" : "entities"}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {visibleEntities.map((entity) => (
            <div
              key={entity.key}
              className="flex items-center justify-between rounded-lg bg-background/60 px-2.5 py-1.5 text-sm"
            >
              <div className="flex items-center gap-2 min-w-0">
                {entity.icon && (
                  <span className="text-base">{entity.icon}</span>
                )}
                <span className="truncate font-medium">{entity.name}</span>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => onOpenEntityConfig(entity.key)}
              >
                <Palette className="h-3 w-3" />
              </Button>
            </div>
          ))}

          {remainingCount > 0 && (
            <div className="py-1 text-center">
              <span className="text-xs text-muted-foreground">
                +{remainingCount} more
              </span>
            </div>
          )}
        </div>

        {totalFallbacks > 0 && (
          <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
            <ChevronRight className="h-3 w-3" />
            <span>
              {totalFallbacks} fallback{totalFallbacks === 1 ? "" : "s"}
            </span>
          </div>
        )}
      </div>

      <div
        className={cn(
          "absolute bottom-0 right-0 size-16 -translate-y-1/2 translate-x-1/3 rounded-full blur-2xl",
          color.dot,
          "opacity-20",
        )}
      />
    </div>
  );
}
