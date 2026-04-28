import {
  formatCompactNumber,
  formatCurrency,
  formatDuration,
  formatNumber,
  formatPercent,
  formatTokensPerSecond,
} from "../../pages/model-stats/model-stats-utils";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import { Skeleton } from "../skeleton";

type ModelStatsSummaryCardsProps = {
  loading: boolean;
  totalSpend: number;
  totalRequests: number;
  totalTokens: number;
  avgSuccessRate: number;
  totalErrors: number;
  avgLatency: number;
  avgCostPerRequest: number;
  uniqueModels: number;
  avgTokensPerSecond: number;
  maxTokensPerSecond: number;
  rangeLabel: string;
};

export function ModelStatsSummaryCards({
  loading,
  totalSpend,
  totalRequests,
  totalTokens,
  avgSuccessRate,
  totalErrors,
  avgLatency,
  avgCostPerRequest,
  uniqueModels,
  rangeLabel,
  avgTokensPerSecond,
  maxTokensPerSecond,
}: ModelStatsSummaryCardsProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-b from-background to-blue-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Spend ({rangeLabel})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold">{formatCurrency(totalSpend)}</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-b from-background to-emerald-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Requests ({rangeLabel})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold">
                {formatCompactNumber(totalRequests)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-b from-background to-violet-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Tokens ({rangeLabel})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold">
                {formatCompactNumber(totalTokens)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-b from-background to-amber-500/5">
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Tokens/Sec
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold">
                {formatTokensPerSecond(avgTokensPerSecond)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Max Tokens/Sec
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold">
                {formatTokensPerSecond(maxTokensPerSecond)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold">{formatDuration(avgLatency)}</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Total Errors ({rangeLabel})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <p
                className={`text-2xl font-bold ${
                  totalErrors > 50
                    ? "text-red-600"
                    : totalErrors > 10
                      ? "text-yellow-600"
                      : ""
                }`}
              >
                {formatNumber(totalErrors)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Cost / Request
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <p className="text-2xl font-bold">
                {formatCurrency(avgCostPerRequest)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Models</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-12" />
            ) : (
              <p className="text-2xl font-bold">{uniqueModels}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Tokens/Sec
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold">
                {formatTokensPerSecond(avgTokensPerSecond)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Max Tokens/Sec
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-2xl font-bold">
                {formatTokensPerSecond(maxTokensPerSecond)}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
