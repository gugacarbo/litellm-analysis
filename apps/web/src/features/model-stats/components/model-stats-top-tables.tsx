import type { ModelStats } from "@/features/model-stats/model-stats-types";
import {
  formatCompactNumber,
  formatCurrency,
} from "@/features/model-stats/model-stats-utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { BarRow } from "./bar-row";

type ModelStatsTopTablesProps = {
  data: ModelStats[];
  loading: boolean;
  rangeLabel: string;
};

export function ModelStatsTopTables({
  data,
  loading,
  rangeLabel,
}: ModelStatsTopTablesProps) {
  const topBySpend = [...data]
    .sort((a, b) => Number(b.total_spend) - Number(a.total_spend))
    .slice(0, 8);

  const topByRequests = [...data]
    .sort((a, b) => Number(b.request_count) - Number(a.request_count))
    .slice(0, 8);

  const maxSpend = topBySpend[0] ? Number(topBySpend[0].total_spend) : 0;
  const maxRequests = topByRequests[0]
    ? Number(topByRequests[0].request_count)
    : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Top Models by Spend ({rangeLabel})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-2 w-3/4" />
                </div>
              ))
            : topBySpend.map((m) => (
                <BarRow
                  key={m.model}
                  label={m.model}
                  value={Number(m.total_spend)}
                  formatted={formatCurrency(m.total_spend)}
                  max={maxSpend}
                  color="bg-blue-500"
                  href={`/model-stats/${encodeURIComponent(m.model)}`}
                  disabled={m.enabled === false}
                />
              ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Models by Requests ({rangeLabel})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading
            ? Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-2 w-3/4" />
                </div>
              ))
            : topByRequests.map((m) => (
                <BarRow
                  key={m.model}
                  label={m.model}
                  value={Number(m.request_count)}
                  formatted={`${formatCompactNumber(m.request_count)} reqs`}
                  max={maxRequests}
                  color="bg-emerald-500"
                  href={`/model-stats/${encodeURIComponent(m.model)}`}
                  disabled={m.enabled === false}
                />
              ))}
        </CardContent>
      </Card>
    </div>
  );
}
