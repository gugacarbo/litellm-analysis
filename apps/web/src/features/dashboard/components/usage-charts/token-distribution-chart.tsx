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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { ChartTooltipContent } from "@/shared/components/ui/chart-tooltip";
import { Skeleton } from "@/shared/components/ui/skeleton";
import type { TokenDistributionItem } from "../../types/dashboard-types";
import { formatNumber } from "../../utils/dashboard-utils";

type TokenDistributionChartProps = {
  data: TokenDistributionItem[];
  loading: boolean;
};

export function TokenDistributionChart({
  data,
  loading,
}: TokenDistributionChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Token Distribution by Model</CardTitle>
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
