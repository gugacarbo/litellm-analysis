import type { ConnectionState } from "monitor-types";

interface ConnectionBadgeProps {
  status: ConnectionState;
  alertCount: number;
}

export function ConnectionBadge({ status, alertCount }: ConnectionBadgeProps) {
  const colorMap: Record<ConnectionState, string> = {
    connected: "bg-green-500",
    connecting: "bg-yellow-500 animate-pulse",
    reconnecting: "bg-yellow-500 animate-pulse",
    disconnected: "bg-red-500",
  };
  const labelMap: Record<ConnectionState, string> = {
    connected: "Connected",
    connecting: "Connecting...",
    reconnecting: "Reconnecting...",
    disconnected: "Disconnected",
  };
  return (
    <div className="flex items-center gap-2">
      {alertCount > 0 && (
        <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800">
          {alertCount} active
        </span>
      )}
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <span className={`h-2 w-2 rounded-full ${colorMap[status]}`} />
        {labelMap[status]}
      </div>
    </div>
  );
}
