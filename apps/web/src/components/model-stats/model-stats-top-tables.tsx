import type { ModelStats } from "../../pages/model-stats/model-stats-types";
import {
  formatCurrency,
  formatNumber,
} from "../../pages/model-stats/model-stats-utils";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import { Skeleton } from "../skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../table";

type ModelStatsTopTablesProps = {
  data: ModelStats[];
  loading: boolean;
  totalSpend: number;
  totalRequests: number;
};

export function ModelStatsTopTables({
  data,
  loading,
  totalSpend,
  totalRequests,
}: ModelStatsTopTablesProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Top Models by Spend</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead className="text-right">Spend</TableHead>
                <TableHead className="text-right">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-4 w-16 ml-auto" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-4 w-12 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                : data.slice(0, 5).map((m, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-mono text-xs">
                        {m.model}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(m.total_spend)}
                      </TableCell>
                      <TableCell className="text-right">
                        {totalSpend > 0
                          ? (
                              (Number(m.total_spend) / totalSpend) *
                              100
                            ).toFixed(1)
                          : 0}
                        %
                      </TableCell>
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top Models by Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead className="text-right">Requests</TableHead>
                <TableHead className="text-right">%</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell>
                        <Skeleton className="h-4 w-32" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-4 w-16 ml-auto" />
                      </TableCell>
                      <TableCell className="text-right">
                        <Skeleton className="h-4 w-12 ml-auto" />
                      </TableCell>
                    </TableRow>
                  ))
                : [...data]
                    .sort(
                      (a, b) =>
                        Number(b.request_count) - Number(a.request_count),
                    )
                    .slice(0, 5)
                    .map((m, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-mono text-xs">
                          {m.model}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(m.request_count)}
                        </TableCell>
                        <TableCell className="text-right">
                          {totalRequests > 0
                            ? (
                                (Number(m.request_count) / totalRequests) *
                                100
                              ).toFixed(1)
                            : 0}
                          %
                        </TableCell>
                      </TableRow>
                    ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
