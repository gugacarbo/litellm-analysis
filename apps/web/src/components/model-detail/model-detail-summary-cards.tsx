import type { ModelDetailSummary } from '../../pages/model-detail/model-detail-types';
import {
  formatCurrency,
  formatDuration,
  formatNumber,
  formatPercent,
} from '../../pages/model-detail/model-detail-utils';
import { Card, CardContent, CardHeader, CardTitle } from '../card';
import { Skeleton } from '../skeleton';

type Props = {
  summary: ModelDetailSummary | null;
  loading: boolean;
};

export function ModelDetailSummaryCards({ summary, loading }: Props) {
  const cards = [
    {
      title: 'Total Spend',
      value: summary ? formatCurrency(summary.totalSpend) : '-',
    },
    {
      title: 'Total Requests',
      value: summary ? formatNumber(summary.totalRequests) : '-',
    },
    {
      title: 'Avg Latency',
      value: summary ? formatDuration(summary.avgLatencyMs) : '-',
    },
    {
      title: 'Success Rate',
      value: summary ? formatPercent(summary.successRate) : '-',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card key={card.title}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-8 w-24" />
            ) : (
              <p className="text-2xl font-bold">{card.value}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
