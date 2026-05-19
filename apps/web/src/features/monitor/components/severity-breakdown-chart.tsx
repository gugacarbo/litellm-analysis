import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { ChartTooltipContent } from "@/shared/components/ui/chart-tooltip";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/lib/utils";
import type { SeveritySlice } from "../hooks/use-monitor-derived";

interface SeverityBreakdownChartProps {
  data: SeveritySlice[];
  loading?: boolean;
}

export function SeverityBreakdownChart({
  data,
  loading,
}: SeverityBreakdownChartProps) {
  if (loading) {
    return (
      <Card>
        <Skeleton className="h-60 w-full" />
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className={cn("flex items-center justify-center h-60")}>
          <p className="text-sm text-muted-foreground">No alerts</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alerts by Severity</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={90}
              paddingAngle={2}
            >
              {data.map((item, index) => (
                <Cell key={`cell-${index}`} fill={item.color} />
              ))}
            </Pie>
            <Tooltip content={<ChartTooltipContent />} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
