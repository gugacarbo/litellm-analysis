import {
  Activity,
  CheckCircle,
  Clock,
  DollarSign,
  Hash,
  Zap,
} from "lucide-react";
import { cn } from "../../lib/utils";
import {
  formatCompactNumber,
  formatCurrency,
  formatDuration,
  formatPercent,
  formatTokensPerSecond,
} from "../../pages/model-stats/model-stats-utils";
import { Skeleton } from "../ui/skeleton";

type CardVariant =
  | "spend"
  | "requests"
  | "tokens"
  | "success"
  | "latency"
  | "throughput"
  | "cost";

const cardConfig: Record<
  CardVariant,
  {
    icon: typeof DollarSign;
    iconBg: string;
    iconColor: string;
    gradientFrom: string;
    gradientTo: string;
    borderColor: string;
  }
> = {
  spend: {
    icon: DollarSign,
    iconBg: "bg-amber-500/10",
    iconColor: "text-amber-600 dark:text-amber-400",
    gradientFrom: "from-amber-500/5",
    gradientTo: "to-transparent",
    borderColor: "border-amber-500/20",
  },
  requests: {
    icon: Activity,
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-600 dark:text-blue-400",
    gradientFrom: "from-blue-500/5",
    gradientTo: "to-transparent",
    borderColor: "border-blue-500/20",
  },
  tokens: {
    icon: Hash,
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-600 dark:text-violet-400",
    gradientFrom: "from-violet-500/5",
    gradientTo: "to-transparent",
    borderColor: "border-violet-500/20",
  },
  success: {
    icon: CheckCircle,
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    gradientFrom: "from-emerald-500/5",
    gradientTo: "to-transparent",
    borderColor: "border-emerald-500/20",
  },
  latency: {
    icon: Clock,
    iconBg: "bg-slate-500/10",
    iconColor: "text-slate-600 dark:text-slate-400",
    gradientFrom: "from-slate-500/5",
    gradientTo: "to-transparent",
    borderColor: "border-slate-500/20",
  },
  throughput: {
    icon: Zap,
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-600 dark:text-violet-400",
    gradientFrom: "from-violet-500/5",
    gradientTo: "to-transparent",
    borderColor: "border-violet-500/20",
  },
  cost: {
    icon: DollarSign,
    iconBg: "bg-orange-500/10",
    iconColor: "text-orange-600 dark:text-orange-400",
    gradientFrom: "from-orange-500/5",
    gradientTo: "to-transparent",
    borderColor: "border-orange-500/20",
  },
};

interface MetricCardProps {
  title: string;
  value: string;
  variant: CardVariant;
  subtitle?: string;
  progress?: number;
  progressLabel?: string;
  loading?: boolean;
  valueColor?: string;
}

function MetricCard({
  title,
  value,
  variant,
  subtitle,
  progress,
  progressLabel,
  loading,
  valueColor,
}: MetricCardProps) {
  const config = cardConfig[variant];
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-gradient-to-br p-4",
        config.gradientFrom,
        config.gradientTo,
        config.borderColor,
      )}
    >
      {/* Glass effect overlay */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-200",
          "group-hover:opacity-100",
          config.gradientFrom,
        )}
      />

      <div className="relative z-10">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg",
                config.iconBg,
              )}
            >
              <Icon className={cn("h-4 w-4", config.iconColor)} />
            </div>
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {title}
            </span>
          </div>
        </div>

        {loading ? (
          <Skeleton className="h-9 w-28" />
        ) : (
          <p
            className={cn(
              "mb-1 text-2xl font-bold tracking-tight",
              valueColor || "text-foreground",
            )}
          >
            {value}
          </p>
        )}

        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}

        {progress !== undefined && !loading && (
          <div className="mt-3">
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground">
                {progressLabel}
              </span>
              <span className="text-[10px] font-medium">
                {formatPercent(progress)}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  variant === "success" && "bg-emerald-500",
                )}
                style={{
                  width: `${Math.min(100, Math.max(0, progress))}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

type ModelStatsSummaryCardsProps = {
  loading: boolean;
  totalSpend: number;
  totalRequests: number;
  totalTokens: number;
  avgSuccessRate: number;
  totalErrors: number;
  avgLatency: number;
  avgCostPerRequest: number;
  uniqueModels: number;
  avgTokensPerSecond: number;
  maxTokensPerSecond: number;
  rangeLabel: string;
};

export function ModelStatsSummaryCards({
  loading,
  totalSpend,
  totalRequests,
  totalTokens,
  avgSuccessRate,
  avgLatency,
  avgCostPerRequest,
  rangeLabel,
  avgTokensPerSecond,
  maxTokensPerSecond,
}: ModelStatsSummaryCardsProps) {
  const successRateColor =
    avgSuccessRate > 95
      ? "text-emerald-600 dark:text-emerald-400"
      : avgSuccessRate > 90
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400";

  return (
    <div className="space-y-4">
      {/* Primary Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard
          title="Total Spend"
          value={formatCurrency(totalSpend)}
          variant="spend"
          subtitle={rangeLabel}
          loading={loading}
        />
        <MetricCard
          title="Total Requests"
          value={formatCompactNumber(totalRequests)}
          variant="requests"
          subtitle={rangeLabel}
          loading={loading}
        />
        <MetricCard
          title="Total Tokens"
          value={formatCompactNumber(totalTokens)}
          variant="tokens"
          subtitle={rangeLabel}
          loading={loading}
        />
        <MetricCard
          title="Success Rate"
          value={formatPercent(avgSuccessRate)}
          variant="success"
          progress={avgSuccessRate}
          progressLabel="Success"
          loading={loading}
          valueColor={successRateColor}
        />
        <MetricCard
          title="Avg Cost/Request"
          value={formatCurrency(avgCostPerRequest)}
          variant="cost"
          loading={loading}
        />
      </div>

      {/* Throughput & Latency Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          title="Avg Tokens/Sec"
          value={formatTokensPerSecond(avgTokensPerSecond)}
          variant="throughput"
          loading={loading}
        />
        <MetricCard
          title="Max Tokens/Sec"
          value={formatTokensPerSecond(maxTokensPerSecond)}
          variant="throughput"
          subtitle="Peak throughput"
          loading={loading}
        />
        <MetricCard
          title="Avg Latency"
          value={formatDuration(avgLatency)}
          variant="latency"
          loading={loading}
        />
      </div>
    </div>
  );
}
