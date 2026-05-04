import { ChevronRight, Globe, Hash, Palette, Users, Zap } from "lucide-react";
import type { ModelStatistics } from "../../lib/api-client/analytics";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import {
  formatCompactNumber,
  formatCurrency,
  formatDuration,
  formatPercent,
  getHealthLevel,
  getModelColor,
  MODEL_HEALTH_COLORS,
} from "./model-stations-utils";

export type EntityItem = {
  key: string;
  name: string;
  icon?: string;
};

export type ModelStationCardProps = {
  modelName: string;
  entities: EntityItem[];
  totalFallbacks: number;
  stats?: ModelStatistics;
  onOpenEntityConfig: (key: string) => void;
};

const MAX_VISIBLE_ENTITIES = 3;

export function ModelStationCard({
  modelName,
  entities,
  totalFallbacks,
  stats,
  onOpenEntityConfig,
}: ModelStationCardProps) {
  const color = getModelColor(modelName);
  const visibleEntities = entities.slice(0, MAX_VISIBLE_ENTITIES);
  const remainingCount = entities.length - MAX_VISIBLE_ENTITIES;

  const healthLevel = stats
    ? getHealthLevel(stats.success_rate, stats.error_count)
    : null;
  const healthColors = healthLevel ? MODEL_HEALTH_COLORS[healthLevel] : null;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border transition-all duration-200 hover:shadow-lg hover:shadow-black/5",
        color.bg,
        color.border,
      )}
    >
      {/* Gradient accent bar */}
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-30" />

      {/* Glow effect */}
      <div
        className={cn(
          "absolute -right-8 -bottom-8 size-32 rounded-full blur-3xl",
          color.dot,
          "opacity-15 transition-opacity duration-300 group-hover:opacity-25",
        )}
      />

      <div className="relative p-4">
        {/* Header: Model name + health indicator */}
        <div className="mb-4 flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div
                className={cn("size-2.5 shrink-0 rounded-full", color.dot)}
              />
              <p
                className={cn(
                  "truncate font-mono text-base font-bold tracking-tight",
                  color.text,
                )}
              >
                {modelName}
              </p>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {entities.length}{" "}
                {entities.length === 1 ? "entity" : "entities"}
              </span>
              {healthColors && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      className={cn(
                        "flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                        healthColors.bg,
                        healthColors.text,
                      )}
                    >
                      <div
                        className={cn(
                          "size-1.5 rounded-full",
                          healthColors.dot,
                        )}
                      />
                      {formatPercent(stats?.success_rate ?? null)}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Health: {healthLevel} | Success rate:{" "}
                      {formatPercent(stats?.success_rate ?? null)}
                    </p>
                    {stats && (
                      <p className="text-muted-foreground">
                        {stats.error_count} error
                        {stats.error_count !== 1 ? "s" : ""}
                      </p>
                    )}
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          </div>

          {/* Stats pills */}
          {stats && (
            <div className="flex flex-wrap justify-end gap-1">
              <StatPill
                icon={<Zap className="h-3 w-3" />}
                value={formatCompactNumber(stats.request_count)}
                tooltip={`${stats.request_count} requests`}
              />
              <StatPill
                icon={<span className="text-xs">$</span>}
                value={formatCurrency(stats.total_spend)}
                tooltip={`$${stats.total_spend.toFixed(4)} total spend`}
              />
            </div>
          )}
        </div>

        {/* Entity list */}
        <div className="mb-3 space-y-1.5">
          {visibleEntities.map((entity) => (
            <div
              key={entity.key}
              className="flex items-center justify-between rounded-lg bg-background/70 px-2.5 py-1.5 text-sm backdrop-blur-sm transition-colors hover:bg-background/90"
            >
              <div className="flex items-center gap-2 min-w-0">
                {entity.icon && <span className="text-sm">{entity.icon}</span>}
                <span className="truncate font-medium">{entity.name}</span>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                className="h-5 w-5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => onOpenEntityConfig(entity.key)}
              >
                <Palette className="h-3 w-3" />
              </Button>
            </div>
          ))}

          {remainingCount > 0 && (
            <div className="py-0.5 text-center">
              <span className="text-xs text-muted-foreground">
                +{remainingCount} more
              </span>
            </div>
          )}
        </div>

        {/* Metrics grid (if stats available) */}
        {stats && (
          <div className="mb-3 grid grid-cols-3 gap-2 rounded-lg bg-background/50 p-2 backdrop-blur-sm">
            <MetricItem
              icon={<Hash className="h-3 w-3 text-muted-foreground" />}
              label="Tokens"
              value={formatCompactNumber(stats.total_tokens)}
            />
            <MetricItem
              icon={<Zap className="h-3 w-3 text-muted-foreground" />}
              label="Latency"
              value={formatDuration(stats.avg_latency_ms)}
            />
            <MetricItem
              icon={<Users className="h-3 w-3 text-muted-foreground" />}
              label="Users"
              value={formatCompactNumber(stats.unique_users)}
            />
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between">
          {totalFallbacks > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <ChevronRight className="h-3 w-3" />
              <span>
                {totalFallbacks} fallback{totalFallbacks === 1 ? "" : "s"}
              </span>
            </div>
          )}

          {stats && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Globe className="h-3 w-3" />
              <span>
                {stats.last_seen
                  ? `Active ${formatRelativeTime(stats.last_seen)}`
                  : "No recent activity"}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

type StatPillProps = {
  icon: React.ReactNode;
  value: string;
  tooltip: string;
};

function StatPill({ icon, value, tooltip }: StatPillProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-1 rounded-full bg-background/70 px-1.5 py-0.5 text-xs font-medium backdrop-blur-sm">
          {icon}
          <span>{value}</span>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}

type MetricItemProps = {
  icon: React.ReactNode;
  label: string;
  value: string;
};

function MetricItem({ icon, label, value }: MetricItemProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex flex-col items-center rounded-md bg-background/50 p-1.5 text-center">
          <div className="mb-0.5">{icon}</div>
          <div className="text-xs font-semibold">{value}</div>
          <div className="text-[10px] text-muted-foreground">{label}</div>
        </div>
      </TooltipTrigger>
      <TooltipContent>
        <p className="font-medium">
          {label}: {value}
        </p>
      </TooltipContent>
    </Tooltip>
  );
}

function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
