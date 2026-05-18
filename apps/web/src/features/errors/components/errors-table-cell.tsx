import type { ErrorLog } from "@lite-llm/contracts/analytics";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import { APP_LOCALE } from "@/shared/lib/locale";
import { formatDateTime } from "@/shared/lib/spend-log-utils";
import type { TableColumn } from "../types/errors-table-columns";
import { getErrorTypeBadgeClass, getStatusBadgeClass } from "./errors-utils";

type RenderErrorCellParams = {
  errorLog: ErrorLog;
  columnKey: TableColumn["key"];
  onSelectError: (errorLog: ErrorLog) => void;
};

export function renderErrorCell({
  errorLog,
  columnKey,
  onSelectError,
}: RenderErrorCellParams) {
  const statusCode = errorLog.status_code || 0;
  const errorType = errorLog.error_type || "Error";
  const message = errorLog.error_message || "-";

  switch (columnKey) {
    case "time":
      return (
        <span className="text-xs whitespace-nowrap text-muted-foreground">
          {errorLog.timestamp ? formatDateTime(errorLog.timestamp) : "-"}
        </span>
      );
    case "status":
      return (
        <Badge variant="secondary" className={getStatusBadgeClass(statusCode)}>
          {statusCode || "N/A"}
        </Badge>
      );
    case "type":
      return (
        <Badge
          variant="secondary"
          className={getErrorTypeBadgeClass(errorType)}
        >
          {errorType}
        </Badge>
      );
    case "model": {
      const showLiteLLM =
        errorLog.litellm_model_name &&
        errorLog.litellm_model_name !== errorLog.model;
      return (
        <div className="flex flex-col gap-0.5">
          <span className="font-mono text-xs font-medium break-all">
            {errorLog.model || "-"}
          </span>
          {showLiteLLM && (
            <span className="text-[10px] text-muted-foreground font-mono break-all">
              LiteLLM: {errorLog.litellm_model_name}
            </span>
          )}
        </div>
      );
    }
    case "user":
      return (
        <span className="text-sm text-muted-foreground break-all">
          {errorLog.user || "-"}
        </span>
      );
    case "apiKey": {
      const apiKey = errorLog.api_key;
      if (!apiKey) {
        return <span className="text-xs text-muted-foreground">-</span>;
      }
      const truncated =
        apiKey.length > 16
          ? `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`
          : apiKey;
      return (
        <span
          className="font-mono text-xs text-muted-foreground"
          title={apiKey}
        >
          {truncated}
        </span>
      );
    }
    case "spendStatus": {
      const status = errorLog.spend_status;
      if (!status) {
        return <span className="text-xs text-muted-foreground">-</span>;
      }
      const normalizedStatus = status.toLowerCase();
      let badgeClass = "bg-muted text-muted-foreground";
      if (normalizedStatus === "success" || normalizedStatus === "completed") {
        badgeClass = "bg-green-500/15 text-green-700 border-green-500/30";
      } else if (
        normalizedStatus === "error" ||
        normalizedStatus === "failed"
      ) {
        badgeClass = "bg-red-500/15 text-red-700 border-red-500/30";
      } else if (
        normalizedStatus === "pending" ||
        normalizedStatus === "processing"
      ) {
        badgeClass = "bg-amber-500/15 text-amber-700 border-amber-500/30";
      }
      return (
        <Badge variant="secondary" className={badgeClass}>
          {status}
        </Badge>
      );
    }
    case "message":
      return (
        <span
          className="inline-block max-w-xl text-sm text-muted-foreground"
          title={message}
        >
          {message.length > 96 ? `${message.slice(0, 96)}...` : message}
        </span>
      );
    case "requestId":
      return (
        <span className="font-mono text-xs text-muted-foreground break-all">
          {errorLog.id}
        </span>
      );
    case "requestKwargs":
      if (
        errorLog.request_kwargs &&
        Object.keys(errorLog.request_kwargs).length > 0
      ) {
        return (
          <Badge
            variant="secondary"
            className="bg-green-500/15 text-green-700 border-green-500/30"
          >
            {Object.keys(errorLog.request_kwargs).length} params
          </Badge>
        );
      }
      return <span className="text-xs text-muted-foreground">-</span>;
    case "partialTokens": {
      const tokens = errorLog.total_tokens;
      if (tokens == null || tokens === 0) {
        return <span className="text-xs text-muted-foreground">-</span>;
      }
      return (
        <span className="text-xs font-medium tabular-nums text-right">
          {tokens.toLocaleString(APP_LOCALE)}
        </span>
      );
    }
    case "partialSpend": {
      const spend = errorLog.spend;
      if (spend == null || spend === 0) {
        return <span className="text-xs text-muted-foreground">-</span>;
      }
      return (
        <span className="text-xs font-medium tabular-nums text-right text-amber-600">
          ${spend.toFixed(4)}
        </span>
      );
    }
    case "actions":
      return (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onSelectError(errorLog)}
        >
          Open
        </Button>
      );
  }
}
