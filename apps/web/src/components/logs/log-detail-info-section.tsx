import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Key,
  Timer,
  TrendingUp,
  User,
} from "lucide-react";
import type { ReactNode } from "react";
import {
  formatDuration,
  formatFullDateTime,
  maskApiKey,
} from "../../lib/spend-log-utils";
import type { SpendLog } from "../../types/analytics";
import { Badge } from "../badge";

type DetailRowProps = {
  icon: typeof User;
  label: string;
  value: ReactNode;
  mono?: boolean;
};

function DetailRow({ icon: Icon, label, value, mono = false }: DetailRowProps) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 px-3 py-2.5">
      <dt className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {label}
      </dt>
      <dd
        className={`text-sm font-medium break-words ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

type LogDetailInfoSectionsProps = {
  log: SpendLog;
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
  const isSuccess = log.status === "200" || log.status === "success";

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="overflow-hidden rounded-lg border">
        <div className="border-b bg-muted/30 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Request Info
        </div>
        <dl className="divide-y divide-border">
          <DetailRow icon={User} label="User" value={log.user || "N/A"} />
          <DetailRow icon={Key} label="Model" value={log.model} mono />
          <DetailRow
            icon={Key}
            label="API Key"
            value={maskApiKey(log.api_key)}
            mono
          />
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
        </dl>
      </section>

      <section className="overflow-hidden rounded-lg border">
        <div className="border-b bg-muted/30 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Timing Details
        </div>
        <dl className="divide-y divide-border">
          <DetailRow
            icon={Clock}
            label="Start Time"
            value={formatFullDateTime(log.start_time)}
          />
          <DetailRow
            icon={Clock}
            label="End Time"
            value={formatFullDateTime(log.end_time)}
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
        </dl>
      </section>
    </div>
  );
}
