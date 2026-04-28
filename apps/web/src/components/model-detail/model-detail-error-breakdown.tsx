import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ModelErrorBreakdown } from '../../pages/model-detail/model-detail-types';
import { formatNumber } from '../../pages/model-detail/model-detail-utils';
import { CHART_HEIGHT } from '../../pages/model-detail/model-detail-utils';
import { Card, CardContent, CardHeader, CardTitle } from '../card';
import { ChartTooltipContent } from '../chart-tooltip';
import { Skeleton } from '../skeleton';

type Props = {
  data: ModelErrorBreakdown[];
  loading: boolean;
};

export function ModelDetailErrorBreakdown({ data, loading }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Error Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <Skeleton className="h-64 w-full" />
        ) : data.length > 0 ? (
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart data={data.slice(0, 8)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={formatNumber} />
              <YAxis
                dataKey="errorType"
                type="category"
                width={180}
                tick={{ fontSize: 11 }}
              />
              <Tooltip
                content={<ChartTooltipContent />}
                formatter={(v) => formatNumber(Number(v))}
              />
              <Bar dataKey="count" fill="#ef4444" name="Errors" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            No errors recorded
          </div>
        )}
      </CardContent>
    </Card>
  );
}
