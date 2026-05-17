import type { SpendLog } from "@lite-llm/api-contracts/analytics";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatNumber } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { ChartTooltipContent } from "../../ui/chart-tooltip";

interface TokenDistributionChartProps {
  log: SpendLog;
}

type TokenDataPoint = {
  name: string;
  tokens: number;
  color: string;
};

export function TokenDistributionChart({ log }: TokenDistributionChartProps) {
  const data: TokenDataPoint[] = [
    { name: "Input", tokens: log.prompt_tokens, color: "#3b82f6" },
    { name: "Output", tokens: log.completion_tokens, color: "#f59e0b" },
  ];

  const inputRatio =
    log.total_tokens > 0
      ? ((log.prompt_tokens / log.total_tokens) * 100).toFixed(1)
      : "0.0";
  const outputRatio =
    log.total_tokens > 0
      ? ((log.completion_tokens / log.total_tokens) * 100).toFixed(1)
      : "0.0";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Token Distribution</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={data} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid
              strokeDasharray="3 3"
              horizontal={true}
              vertical={false}
            />
            <XAxis type="number" tickFormatter={formatNumber} />
            <YAxis type="category" dataKey="name" width={60} />
            <Tooltip
              content={<ChartTooltipContent />}
              formatter={(v) => formatNumber(Number(v))}
            />
            <Bar
              dataKey="tokens"
              name="Tokens"
              fill="#3b82f6"
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-[#3b82f6]" />
            <span className="text-muted-foreground">Input: </span>
            <span className="font-medium">{inputRatio}%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm bg-[#f59e0b]" />
            <span className="text-muted-foreground">Output: </span>
            <span className="font-medium">{outputRatio}%</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
