import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from "../../pages/model-stats/model-stats-utils";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import { Skeleton } from "../skeleton";

type ModelStatsSummaryCardsProps = {
  loading: boolean;
  totalSpend: number;
  totalRequests: number;
  totalTokens: number;
  avgSuccessRate: number;
};

export function ModelStatsSummaryCards({
  loading,
  totalSpend,
  totalRequests,
  totalTokens,
  avgSuccessRate,
}: ModelStatsSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <p className="text-2xl font-bold">{formatCurrency(totalSpend)}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <p className="text-2xl font-bold">{formatNumber(totalRequests)}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-24" />
          ) : (
            <p className="text-2xl font-bold">{formatNumber(totalTokens)}</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">
            Avg Success Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-8 w-16" />
          ) : (
            <p
              className={`text-2xl font-bold ${
                avgSuccessRate > 95
                  ? "text-green-600"
                  : avgSuccessRate > 90
                    ? "text-yellow-600"
                    : "text-red-600"
              }`}
            >
              {formatPercent(avgSuccessRate)}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
