import { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/shared/components/ui/tabs";
import type { ApiKeyStatItem, SpendByUserItem } from "../types/dashboard-types";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
} from "../utils/dashboard-utils";

type DashboardTopEntitiesProps = {
  loading: boolean;
  apiKeyStats: ApiKeyStatItem[];
  spendByUser: SpendByUserItem[];
};

export function DashboardTopEntities({
  loading,
  apiKeyStats,
  spendByUser,
}: DashboardTopEntitiesProps) {
  const [tab, setTab] = useState("keys");

  const keySkeletonRows = Array.from({ length: 5 }).map((_, i) => (
    <TableRow key={i}>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-4 w-12 ml-auto" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-4 w-16 ml-auto" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-4 w-16 ml-auto" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-4 w-12 ml-auto" />
      </TableCell>
    </TableRow>
  ));

  const userSkeletonRows = Array.from({ length: 5 }).map((_, i) => (
    <TableRow key={i}>
      <TableCell>
        <Skeleton className="h-4 w-24" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-4 w-16 ml-auto" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-4 w-20 ml-auto" />
      </TableCell>
      <TableCell className="text-right">
        <Skeleton className="h-4 w-12 ml-auto" />
      </TableCell>
    </TableRow>
  ));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Entities</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList variant="line" className="mb-4">
            <TabsTrigger value="keys">By API Key</TabsTrigger>
            <TabsTrigger value="users">By User</TabsTrigger>
          </TabsList>
          <TabsContent value="keys">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>API Key</TableHead>
                  <TableHead className="text-right">Requests</TableHead>
                  <TableHead className="text-right">Spend</TableHead>
                  <TableHead className="text-right">Tokens</TableHead>
                  <TableHead className="text-right">Success</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? keySkeletonRows
                  : apiKeyStats.slice(0, 10).map((k) => (
                      <TableRow key={k.key}>
                        <TableCell className="font-mono text-xs">
                          {(k.key || "N/A").slice(0, 12)}...
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(k.request_count)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(k.total_spend)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(k.total_tokens)}
                        </TableCell>
                        <TableCell
                          className={`text-right ${
                            k.success_rate > 95
                              ? "text-green-600"
                              : k.success_rate > 90
                                ? "text-yellow-600"
                                : "text-red-600"
                          }`}
                        >
                          {formatPercent(k.success_rate)}
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </TabsContent>
          <TabsContent value="users">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="text-right">Total Spend</TableHead>
                  <TableHead className="text-right">Tokens</TableHead>
                  <TableHead className="text-right">Requests</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading
                  ? userSkeletonRows
                  : spendByUser.slice(0, 10).map((u, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">
                          {u.user || "Anonymous"}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(u.total_spend)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(u.total_tokens)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatNumber(u.request_count)}
                        </TableCell>
                      </TableRow>
                    ))}
              </TableBody>
            </Table>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
