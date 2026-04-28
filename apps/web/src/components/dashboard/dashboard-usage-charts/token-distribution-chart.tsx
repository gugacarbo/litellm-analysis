import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { TokenDistributionItem } from "../../../pages/dashboard/dashboard-types";
import { formatNumber } from "../../../pages/dashboard/dashboard-utils";
import { Card, CardContent, CardHeader, CardTitle } from "../../card";
import { ChartTooltipContent } from "../../chart-tooltip";
import { Skeleton } from "../../skeleton";

type TokenDistributionChartProps = {
  data: TokenDistributionItem[];
  loading: boolean;
  rangeLabel: string;
};

export function TokenDistributionChart({
  data,
  loading,
  rangeLabel,
}: TokenDistributionChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Token Distribution by Model ({rangeLabel})</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.slice(0, 10)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={formatNumber} />
              <YAxis
                dataKey="model"
                type="category"
                width={120}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                content={<ChartTooltipContent />}
                formatter={(v) => formatNumber(Number(v))}
              />
              <Legend />
              <Bar
                dataKey="prompt_tokens"
                name="Input Tokens"
                fill="#3b82f6"
                stackId="a"
                maxBarSize={30}
              />
              <Bar
                dataKey="completion_tokens"
                name="Output Tokens"
                fill="#10b981"
                stackId="a"
                maxBarSize={30}
              />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );
}
