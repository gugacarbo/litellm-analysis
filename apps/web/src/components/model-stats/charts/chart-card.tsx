import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import { Skeleton } from "../skeleton";

type ChartCardProps = {
  title: string;
  loading: boolean;
  hasData: boolean;
  children: ReactNode;
};

export function ChartCard({
  title,
  loading,
  hasData,
  children,
}: ChartCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : hasData ? (
          children
        ) : null}
      </CardContent>
    </Card>
  );
}
