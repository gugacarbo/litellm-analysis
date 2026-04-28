import type { ModelUser } from "../../pages/model-detail/model-detail-types";
import {
  formatCurrency,
  formatNumber,
} from "../../pages/model-detail/model-detail-utils";
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

type Props = {
  users: ModelUser[];
  loading: boolean;
};

export function ModelDetailUserTable({ users, loading }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Users</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead className="text-right">Spend</TableHead>
              <TableHead className="text-right">Tokens</TableHead>
              <TableHead className="text-right">Requests</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
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
              ))
            ) : users.length > 0 ? (
              users.map((u) => (
                <TableRow key={u.user}>
                  <TableCell className="font-medium">
                    {u.user || "Anonymous"}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(u.totalSpend)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(u.totalTokens)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(u.requestCount)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="h-24 text-center text-muted-foreground"
                >
                  No user data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
