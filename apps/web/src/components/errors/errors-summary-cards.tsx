import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import { Skeleton } from "../skeleton";

type ErrorsTotals = {
  total: number;
  serverErrors: number;
  clientErrors: number;
  uniqueModels: number;
};

type ErrorsSummaryCardsProps = {
  loading: boolean;
  totals: ErrorsTotals;
};

function renderMetric(value: ReactNode, loading: boolean) {
  if (loading) {
    return <Skeleton className="h-8 w-12" />;
  }

  return value;
}

export function ErrorsSummaryCards({
  loading,
  totals,
}: ErrorsSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Total Errors</CardTitle>
        </CardHeader>
        <CardContent>
          {renderMetric(
            <p className="text-2xl font-bold">{totals.total}</p>,
            loading,
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">5xx Errors</CardTitle>
        </CardHeader>
        <CardContent>
          {renderMetric(
            <p className="text-2xl font-bold text-red-600">
              {totals.serverErrors}
            </p>,
            loading,
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">4xx Errors</CardTitle>
        </CardHeader>
        <CardContent>
          {renderMetric(
            <p className="text-2xl font-bold text-amber-600">
              {totals.clientErrors}
            </p>,
            loading,
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Unique Models</CardTitle>
        </CardHeader>
        <CardContent>
          {renderMetric(
            <p className="text-2xl font-bold">{totals.uniqueModels}</p>,
            loading,
          )}
        </CardContent>
      </Card>
    </div>
  );
}
