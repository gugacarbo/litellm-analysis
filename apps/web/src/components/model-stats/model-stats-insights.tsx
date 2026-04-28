import {
  AlertTriangle,
  BarChart3,
  Clock,
  DollarSign,
  TrendingUp,
  Zap,
} from 'lucide-react';
import type { ModelInsight } from '../../pages/model-stats/model-stats-types';
import { Card, CardContent, CardHeader, CardTitle } from '../card';
import { Skeleton } from '../skeleton';

const ICON_MAP = {
  'badge-dollar-sign': DollarSign,
  'trending-up': TrendingUp,
  zap: Zap,
  clock: Clock,
  'bar-chart-3': BarChart3,
  'alert-triangle': AlertTriangle,
} as const;

const TONE_CLASSES = {
  positive:
    'text-emerald-700 dark:text-emerald-300',
  warning: 'text-amber-700 dark:text-amber-300',
  negative: 'text-red-700 dark:text-red-300',
  neutral: 'text-foreground',
} as const;

type ModelStatsInsightsProps = {
  loading: boolean;
  insights: ModelInsight[];
};

export function ModelStatsInsights({
  loading,
  insights,
}: ModelStatsInsightsProps) {
  if (!loading && insights.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {loading
        ? Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent className="space-y-1">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-3 w-40" />
              </CardContent>
            </Card>
          ))
        : insights.map((insight) => {
            const Icon =
              ICON_MAP[insight.label as keyof typeof ICON_MAP] ?? BarChart3;
            return (
              <Card key={insight.label}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5" />
                    {insight.label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-0.5">
                  <p
                    className={`text-lg font-bold truncate ${TONE_CLASSES[insight.tone]}`}
                  >
                    {insight.value}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {insight.detail}
                  </p>
                </CardContent>
              </Card>
            );
          })}
    </div>
  );
}
