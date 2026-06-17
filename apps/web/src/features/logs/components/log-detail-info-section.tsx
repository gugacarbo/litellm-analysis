import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Globe,
  Server,
  Tag,
  Timer,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Badge } from "@/shared/components/ui/badge";
import { DetailRow, InfoSection } from "@/shared/components/ui/detail-row";
import type { ProxyRequestLog } from "@/shared/lib/api-client/spend";
import {
  formatDuration,
  formatFullDateTime,
  formatNumber,
  isProxyLogSuccess,
} from "@/shared/lib/spend-log-utils";
import { LogEstimatedBadges } from "./log-estimated-badges";

type LogDetailInfoSectionsProps = {
  log: ProxyRequestLog;
  statusConfig: { badge: string };
  durationMs: number;
  tokensPerSec: string;
};

export function LogDetailInfoSections({
  log,
  statusConfig,
  durationMs,
  tokensPerSec,
}: LogDetailInfoSectionsProps) {
  const isSuccess = isProxyLogSuccess(log.status);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <InfoSection title="Request Info">
        <DetailRow icon={Tag} label="Model" value={log.model} mono />
        {log.upstream_model ? (
          <DetailRow
            icon={Server}
            label="Upstream Model"
            value={log.upstream_model}
            mono
          />
        ) : null}
        {log.upstream_base_url ? (
          <DetailRow
            icon={Globe}
            label="Upstream Base URL"
            value={log.upstream_base_url}
            mono
          />
        ) : null}
        <DetailRow
          icon={isSuccess ? CheckCircle2 : AlertCircle}
          label="Status"
          value={
            <Badge
              variant={isSuccess ? "secondary" : "destructive"}
              className={statusConfig.badge}
            >
              {log.status}
            </Badge>
          }
        />
        {log.cached_tokens != null && log.cached_tokens > 0 ? (
          <DetailRow
            icon={Zap}
            label="Cached Tokens"
            value={formatNumber(log.cached_tokens)}
          />
        ) : null}
        {log.usage_estimated || log.cost_estimated ? (
          <DetailRow
            icon={Tag}
            label="Estimates"
            value={
              <LogEstimatedBadges
                usageEstimated={log.usage_estimated}
                costEstimated={log.cost_estimated}
              />
            }
          />
        ) : null}
      </InfoSection>

      <InfoSection title="Timing Details">
        <DetailRow
          icon={Clock}
          label="Started At"
          value={formatFullDateTime(log.started_at)}
        />
        <DetailRow
          icon={Clock}
          label="Finished At"
          value={
            log.finished_at
              ? formatFullDateTime(log.finished_at)
              : "In progress"
          }
        />
        <DetailRow
          icon={Timer}
          label="Duration"
          value={formatDuration(durationMs)}
        />
        <DetailRow
          icon={TrendingUp}
          label="Tokens/Second"
          value={tokensPerSec}
        />
        <DetailRow
          icon={Zap}
          label="Time to 1st Token"
          value={log.ttft_ms != null ? `${Math.round(log.ttft_ms)}ms` : "-"}
        />
        {log.latency_ms != null ? (
          <DetailRow
            icon={Timer}
            label="Latency"
            value={`${Math.round(log.latency_ms)}ms`}
          />
        ) : null}
      </InfoSection>
    </div>
  );
}
