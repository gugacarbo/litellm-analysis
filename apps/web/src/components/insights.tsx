import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Skeleton } from "./skeleton";

export type Insight = {
  type: "positive" | "warning" | "negative" | "neutral";
  value: string;
  detail?: string;
  icon?: LucideIcon;
};

export type InsightsProps = {
  insights: Insight[];
  title?: string;
  description?: string;
  loading?: boolean;
};

const TONE_CLASSES = {
  positive: "text-emerald-700 dark:text-emerald-300",
  warning: "text-amber-700 dark:text-amber-300",
  negative: "text-red-700 dark:text-red-300",
  neutral: "text-foreground",
} as const;

export function Insights({
  insights,
  title,
  description,
  loading = false,
}: InsightsProps) {
  if (!loading && insights.length === 0) return null;

  return (
    <div className="space-y-3">
      {title && (
        <div className="space-y-1">
          <h2 className="text-xl font-semibold">{title}</h2>
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading
          ? Array.from({ length: 6 }).map((_, index) => (
              <Card key={`skeleton-${index}`}>
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24" />
                </CardHeader>
                <CardContent className="space-y-1">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-3 w-40" />
                </CardContent>
              </Card>
            ))
          : insights.map((insight, index) => {
              const Icon = insight.icon;
              return (
                <Card key={`insight-${index}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                      {Icon && <Icon className="h-3.5 w-3.5" />}
                      {insight.detail}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <p
                      className={`text-2xl font-bold truncate ${TONE_CLASSES[insight.type]}`}
                    >
                      {insight.value}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
      </div>
    </div>
  );
}
