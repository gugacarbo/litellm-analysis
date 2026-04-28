import { Check, Layers, Palette } from "lucide-react";
import { useState } from "react";
import { cn } from "../../lib/utils";
import type { CategoryDefinition } from "../../types/agent-routing";
import { Button } from "../button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../select";

type ConfigInfo = {
  model: string;
  description?: string;
  fallbackCount: number;
};

type Props = {
  loading: boolean;
  categories: CategoryDefinition[];
  models: string[];
  getCategoryConfigInfo: (key: string) => ConfigInfo | null;
  onOpenCategoryConfig: (key: string) => void;
  onQuickModelChange: (categoryKey: string, model: string) => void;
};

export function CategoryFocusView({
  loading,
  categories,
  models,
  getCategoryConfigInfo,
  onOpenCategoryConfig,
  onQuickModelChange,
}: Props) {
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  const rows = categories.map((category) => {
    const configInfo = getCategoryConfigInfo(category.key);
    return {
      category,
      configInfo,
      hasPrimaryModel: Boolean(configInfo && configInfo.model !== "Unassigned"),
    };
  });

  const configuredCount = rows.filter((row) => row.hasPrimaryModel).length;
  const totalFallbacks = rows.reduce(
    (sum, row) => sum + (row.configInfo?.fallbackCount || 0),
    0,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="font-medium text-foreground">
            {configuredCount}
          </span>
          <span>
            /{categories.length} configured
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <Layers className="h-3 w-3" />
          <span>
            <span className="font-medium text-foreground">
              {totalFallbacks}
            </span>{" "}
            fallback{totalFallbacks === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {rows.map(({ category, configInfo, hasPrimaryModel }) => (
          <div
            key={category.key}
            className={cn(
              "group relative flex flex-col rounded-xl border overflow-hidden p-3 transition-all duration-200",
              hasPrimaryModel
                ? "bg-card hover:border-primary/30"
                : "border-dashed border-amber-500/30 bg-amber-500/5 hover:border-amber-500/50",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{category.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {configInfo?.description || category.description}
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon-sm"
                className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={() => onOpenCategoryConfig(category.key)}
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
                  onQuickModelChange(category.key, value);
                  setOpenDropdown(null);
                }}
                open={openDropdown === category.key}
                onOpenChange={(open) =>
                  setOpenDropdown(open ? category.key : null)
                }
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
        ))}
      </div>
    </div>
  );
}
