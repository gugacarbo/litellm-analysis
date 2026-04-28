import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Copy,
  Globe,
  Key,
  Shield,
  Tag,
  Timer,
  TrendingUp,
  User,
  Users,
  Zap,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  formatDuration,
  formatFullDateTime,
  maskApiKey,
} from "../../lib/spend-log-utils";
import type { SpendLog } from "../../types/analytics";
import { Badge } from "../badge";
import { CollapsibleSection } from "./log-detail-collapsible-section";
import { ContextBadge } from "./log-detail-context-badge";

type DetailRowProps = {
  icon: typeof User;
  label: string;
  value: ReactNode;
  mono?: boolean;
  copyable?: boolean;
  copyValue?: string;
};

function DetailRow({
  icon: Icon,
  label,
  value,
  mono = false,
  copyable = false,
  copyValue,
}: DetailRowProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (copyValue) {
      await navigator.clipboard.writeText(copyValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="grid grid-cols-[120px_1fr] gap-3 px-3 py-2.5">
      <dt className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {label}
      </dt>
      <dd
        className={`text-sm font-medium break-words flex items-center gap-2 ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        <span className="flex-1">{value}</span>
        {copyable && copyValue && (
          <button
            type="button"
            onClick={handleCopy}
            className="shrink-0 text-muted-foreground/50 hover:text-foreground transition-colors"
            title="Copy to clipboard"
          >
            {copied ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        )}
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

  const additionalFields: {
    label: string;
    value: string;
    icon: typeof Globe;
  }[] = [];
  if (log.team_id) {
    additionalFields.push({
      label: "Team ID",
      value: log.team_id,
      icon: Users,
    });
  }
  if (log.end_user) {
    additionalFields.push({
      label: "End User",
      value: log.end_user,
      icon: User,
    });
  }
  if (log.requester_ip_address) {
    additionalFields.push({
      label: "IP Address",
      value: log.requester_ip_address,
      icon: Globe,
    });
  }
  if (log.session_id) {
    additionalFields.push({
      label: "Session ID",
      value: log.session_id,
      icon: Shield,
    });
  }
  if (log.agent_id) {
    additionalFields.push({
      label: "Agent ID",
      value: log.agent_id,
      icon: Zap,
    });
  }
  if (log.organization_id) {
    additionalFields.push({
      label: "Organization",
      value: log.organization_id,
      icon: Shield,
    });
  }
  if (log.request_duration_ms != null) {
    additionalFields.push({
      label: "Req Duration",
      value: `${log.request_duration_ms}ms`,
      icon: Timer,
    });
  }
  if (log.custom_llm_provider) {
    additionalFields.push({
      label: "Provider",
      value: log.custom_llm_provider,
      icon: Globe,
    });
  }
  if (log.api_base) {
    additionalFields.push({
      label: "API Base",
      value: log.api_base,
      icon: Globe,
    });
  }
  if (log.model_id) {
    additionalFields.push({
      label: "Model ID",
      value: log.model_id,
      icon: Tag,
    });
  }
  if (log.model_group) {
    additionalFields.push({
      label: "Model Group",
      value: log.model_group,
      icon: Tag,
    });
  }

  const hasAdditionalFields = additionalFields.length > 0;

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
            copyable
            copyValue={log.api_key}
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
          {log.call_type && (
            <DetailRow
              icon={Tag}
              label="Call Type"
              value={
                <ContextBadge
                  label={log.call_type.replace(/_/g, " ").replace(/\./g, " ")}
                  variant="info"
                />
              }
            />
          )}
          {log.cache_hit && (
            <DetailRow
              icon={Zap}
              label="Cache"
              value={
                <ContextBadge
                  label={log.cache_hit === "true" ? "Cache Hit" : "Cache Miss"}
                  variant={log.cache_hit === "true" ? "success" : "warning"}
                />
              }
            />
          )}
          {hasAdditionalFields && (
            <CollapsibleSection
              title="Additional Details"
              icon={Shield}
              defaultOpen={false}
            >
              <dl className="divide-y divide-border -my-2">
                {additionalFields.map((field) => (
                  <DetailRow
                    key={field.label}
                    icon={field.icon}
                    label={field.label}
                    value={field.value}
                    mono={field.label !== "End User"}
                    copyable={[
                      "Team ID",
                      "Session ID",
                      "Agent ID",
                      "Organization",
                    ].includes(field.label)}
                    copyValue={field.value}
                  />
                ))}
              </dl>
            </CollapsibleSection>
          )}
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
          <DetailRow
            icon={Zap}
            label="Time to 1st Token"
            value={
              log.time_to_first_token_ms != null
                ? `${Math.round(log.time_to_first_token_ms)}ms`
                : "-"
            }
          />
          {log.completion_start_time && (
            <DetailRow
              icon={Clock}
              label="Completion Start"
              value={formatFullDateTime(log.completion_start_time)}
            />
          )}
          {log.request_duration_ms != null && (
            <DetailRow
              icon={Timer}
              label="Request Duration"
              value={`${log.request_duration_ms}ms`}
            />
          )}
        </dl>
      </section>
    </div>
  );
}
