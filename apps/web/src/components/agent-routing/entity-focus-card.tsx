import { Check, Layers, Palette } from "lucide-react";
import { useState } from "react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import type { ConfigInfo } from "./agent-routing-types";

export type EntityFocusCardProps = {
  entityKey: string;
  name: string;
  description: string;
  icon?: string;
  configInfo: ConfigInfo | null;
  models: string[];
  onOpenConfig: (key: string) => void;
  onQuickModelChange: (key: string, model: string) => void;
};

export function EntityFocusCard({
  entityKey,
  name,
  description,
  icon,
  configInfo,
  models,
  onOpenConfig,
  onQuickModelChange,
}: EntityFocusCardProps) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const hasPrimaryModel = Boolean(
    configInfo && configInfo.model !== "Unassigned",
  );

  return (
    <div
      className={cn(
        "group relative flex flex-col rounded-xl border overflow-hidden p-3 transition-all duration-200",
        hasPrimaryModel
          ? "bg-card hover:border-primary/30"
          : "border-dashed border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50",
      )}
    >
      {configInfo?.color && (
        <div
          className="absolute inset-x-0 top-0 h-1 rounded-t-xl"
          style={{ backgroundColor: configInfo.color }}
        />
      )}

      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          {icon && <span className="text-xl">{icon}</span>}
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium">{name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {configInfo?.description || description}
            </p>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon-sm"
          className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
          onClick={() => onOpenConfig(entityKey)}
        >
          <Palette className="h-3.5 w-3.5" />
        </Button>
      </div>

      <div className="mt-3 flex-1">
        <label className="mb-1.5 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
          Model
        </label>
        <Select
          value={hasPrimaryModel ? configInfo?.model : ""}
          onValueChange={(value) => {
            onQuickModelChange(entityKey, value);
            setOpenDropdown(null);
          }}
          open={openDropdown === entityKey}
          onOpenChange={(open) => setOpenDropdown(open ? entityKey : null)}
        >
          <SelectTrigger className="h-8 w-full justify-between font-mono text-xs">
            <SelectValue placeholder="Select model...">
              {hasPrimaryModel ? configInfo?.model : "Select model..."}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {models.map((model) => (
              <SelectItem
                key={model}
                value={model}
                className="font-mono text-xs"
              >
                <div className="flex items-center gap-2">
                  {configInfo?.model === model && (
                    <Check className="h-3 w-3 text-emerald-500" />
                  )}
                  <span>{model}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {configInfo?.fallbackCount ? (
        <div className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
          <Layers className="h-3 w-3" />
          <span>
            +{configInfo.fallbackCount} fallback
            {configInfo.fallbackCount === 1 ? "" : "s"}
          </span>
        </div>
      ) : null}
    </div>
  );
}
