import type { DashboardInsight } from "../../pages/dashboard/dashboard-types";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import { Skeleton } from "../skeleton";

type DashboardInsightsProps = {
  loading: boolean;
  insights: DashboardInsight[];
};

function getToneClass(tone: DashboardInsight["tone"]): string {
  if (tone === "positive") {
    return "text-emerald-700 dark:text-emerald-300";
  }
  if (tone === "warning") {
    return "text-amber-700 dark:text-amber-300";
  }
  return "text-foreground";
}

export function DashboardInsights({
  loading,
  insights,
}: DashboardInsightsProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">Analysis Highlights</h2>
          <p className="text-sm text-muted-foreground">
            Derived signals from usage, cost, and performance data.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Card key={`skeleton-${index}`}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-32" />
              </CardHeader>
              <CardContent className="space-y-1">
                <Skeleton className="h-7 w-24" />
                <Skeleton className="h-3 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold">Analysis Highlights</h2>
        <p className="text-sm text-muted-foreground">
          Derived signals from usage, cost, and performance data.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {insights.map((item) => (
          <Card key={item.title}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {item.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              <p className={`text-2xl font-bold ${getToneClass(item.tone)}`}>
                {item.value}
              </p>
              <p className="text-xs text-muted-foreground">{item.detail}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
