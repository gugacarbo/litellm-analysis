import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import {
  getErrorTypeBadgeClass,
  getStatusBadgeClass,
} from "@/components/errors/errors-utils";
import { APP_LOCALE } from "@/lib/locale";
import { formatDateTime } from "../../lib/spend-log-utils";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
export function renderErrorCell({ errorLog, columnKey, onSelectError }) {
  const statusCode = errorLog.status_code || 0;
  const errorType = errorLog.error_type || "Error";
  const message = errorLog.error_message || "-";
  switch (columnKey) {
    case "time":
      return _jsx("span", {
        className: "text-xs whitespace-nowrap text-muted-foreground",
        children: errorLog.timestamp ? formatDateTime(errorLog.timestamp) : "-",
      });
    case "status":
      return _jsx(Badge, {
        variant: "secondary",
        className: getStatusBadgeClass(statusCode),
        children: statusCode || "N/A",
      });
    case "type":
      return _jsx(Badge, {
        variant: "secondary",
        className: getErrorTypeBadgeClass(errorType),
        children: errorType,
      });
    case "model": {
      const showLiteLLM =
        errorLog.litellm_model_name &&
        errorLog.litellm_model_name !== errorLog.model;
      return _jsxs("div", {
        className: "flex flex-col gap-0.5",
        children: [
          _jsx("span", {
            className: "font-mono text-xs font-medium break-all",
            children: errorLog.model || "-",
          }),
          showLiteLLM &&
            _jsxs("span", {
              className:
                "text-[10px] text-muted-foreground font-mono break-all",
              children: ["LiteLLM: ", errorLog.litellm_model_name],
            }),
        ],
      });
    }
    case "user":
      return _jsx("span", {
        className: "text-sm text-muted-foreground break-all",
        children: errorLog.user || "-",
      });
    case "apiKey": {
      const apiKey = errorLog.api_key;
      if (!apiKey) {
        return _jsx("span", {
          className: "text-xs text-muted-foreground",
          children: "-",
        });
      }
      const truncated =
        apiKey.length > 16
          ? `${apiKey.slice(0, 8)}...${apiKey.slice(-4)}`
          : apiKey;
      return _jsx("span", {
        className: "font-mono text-xs text-muted-foreground",
        title: apiKey,
        children: truncated,
      });
    }
    case "spendStatus": {
      const status = errorLog.spend_status;
      if (!status) {
        return _jsx("span", {
          className: "text-xs text-muted-foreground",
          children: "-",
        });
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
      return _jsx(Badge, {
        variant: "secondary",
        className: badgeClass,
        children: status,
      });
    }
    case "message":
      return _jsx("span", {
        className: "inline-block max-w-xl text-sm text-muted-foreground",
        title: message,
        children: message.length > 96 ? `${message.slice(0, 96)}...` : message,
      });
    case "requestId":
      return _jsx("span", {
        className: "font-mono text-xs text-muted-foreground break-all",
        children: errorLog.id,
      });
    case "requestKwargs":
      if (
        errorLog.request_kwargs &&
        Object.keys(errorLog.request_kwargs).length > 0
      ) {
        return _jsxs(Badge, {
          variant: "secondary",
          className: "bg-green-500/15 text-green-700 border-green-500/30",
          children: [Object.keys(errorLog.request_kwargs).length, " params"],
        });
      }
      return _jsx("span", {
        className: "text-xs text-muted-foreground",
        children: "-",
      });
    case "partialTokens": {
      const tokens = errorLog.total_tokens;
      if (tokens == null || tokens === 0) {
        return _jsx("span", {
          className: "text-xs text-muted-foreground",
          children: "-",
        });
      }
      return _jsx("span", {
        className: "text-xs font-medium tabular-nums text-right",
        children: tokens.toLocaleString(APP_LOCALE),
      });
    }
    case "partialSpend": {
      const spend = errorLog.spend;
      if (spend == null || spend === 0) {
        return _jsx("span", {
          className: "text-xs text-muted-foreground",
          children: "-",
        });
      }
      return _jsxs("span", {
        className: "text-xs font-medium tabular-nums text-right text-amber-600",
        children: ["$", spend.toFixed(4)],
      });
    }
    case "actions":
      return _jsx(Button, {
        variant: "ghost",
        size: "sm",
        onClick: () => onSelectError(errorLog),
        children: "Open",
      });
  }
}
