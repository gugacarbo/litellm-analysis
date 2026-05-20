import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/utils";
import type { DashboardInsight } from "../types/dashboard-types";

type DashboardInsightsProps = {
  loading: boolean;
  insights: DashboardInsight[];
};

function getToneDot(tone: DashboardInsight["tone"]): string {
  if (tone === "positive") return "bg-emerald-500";
  if (tone === "warning") return "bg-amber-500";
  return "bg-muted-foreground";
}

export function DashboardInsights({
  loading,
  insights,
}: DashboardInsightsProps) {
  if (loading) {
    return (
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={`skeleton-${index}`}
            className="flex items-center gap-2 rounded-full px-3 py-1.5"
          >
            <Skeleton className="h-2 w-2 rounded-full shrink-0" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (insights.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {insights.map((item) => (
        <Tooltip key={item.title}>
          <TooltipTrigger asChild>
            <div className="group relative flex items-center gap-2 rounded-full px-3 py-1.5 text-sm transition-colors hover:bg-muted/60">
              <span
                className={cn(
                  "h-2 w-2 rounded-full shrink-0",
                  getToneDot(item.tone),
                )}
              />
              <span className="font-medium">{item.value}</span>
              <span className="text-muted-foreground hidden sm:inline">
                {item.title}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="font-medium">{item.title}</p>
            <p className="text-muted-foreground">{item.detail}</p>
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}
