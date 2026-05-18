import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
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
  const content = loading ? (
    <div className="flex flex-wrap gap-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="flex items-center gap-2 rounded-full bg-muted px-3 py-1.5"
        >
          <Skeleton className="h-2 w-2 rounded-full shrink-0" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  ) : insights.length === 0 ? null : (
    <div className="flex flex-wrap gap-2">
      {insights.map((item) => (
        <div
          key={item.title}
          className="group relative flex items-center gap-2 rounded-full border bg-muted/30 px-3 py-1.5 text-sm transition-colors hover:bg-muted/60"
        >
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
          <div className="absolute bottom-full left-1/2 z-10 mb-2 hidden w-48 -translate-x-1/2 rounded-lg border bg-popover p-2 text-xs text-popover-foreground shadow-md group-hover:block">
            <p className="font-medium">{item.title}</p>
            <p className="text-muted-foreground">{item.detail}</p>
          </div>
        </div>
      ))}
    </div>
  );

  if (content === null) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Analysis Highlights</CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
