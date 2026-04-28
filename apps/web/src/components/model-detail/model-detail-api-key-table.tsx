import type { ModelApiKey } from "../../pages/model-detail/model-detail-types";
import {
  formatCurrency,
  formatNumber,
  formatPercent,
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
  apiKeys: ModelApiKey[];
  loading: boolean;
};

function maskApiKey(key: string): string {
  if (!key || key.length < 8) return key;
  return `${key.slice(0, 4)}...${key.slice(-4)}`;
}

export function ModelDetailApiKeyTable({ apiKeys, loading }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Top API Keys</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>API Key</TableHead>
              <TableHead className="text-right">Spend</TableHead>
              <TableHead className="text-right">Tokens</TableHead>
              <TableHead className="text-right">Requests</TableHead>
              <TableHead className="text-right">Success Rate</TableHead>
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
                  <TableCell className="text-right">
                    <Skeleton className="h-4 w-16 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : apiKeys.length > 0 ? (
              apiKeys.map((key) => (
                <TableRow key={key.apiKey}>
                  <TableCell className="font-medium">
                    {maskApiKey(key.apiKey)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(key.totalSpend)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(key.totalTokens)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(key.requestCount)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatPercent(key.successRate)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="h-24 text-center text-muted-foreground"
                >
                  No API key data available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}