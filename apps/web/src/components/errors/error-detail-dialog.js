import {
  AlertTriangle,
  Clock,
  Code2,
  Cpu,
  DollarSign,
  Hash,
  KeyRound,
  User,
} from "lucide-react";
import {
  Fragment as _Fragment,
  jsx as _jsx,
  jsxs as _jsxs,
} from "react/jsx-runtime";
import {
  getErrorTypeBadgeClass,
  getStatusBadgeClass,
} from "@/components/errors/errors-utils";
import { APP_LOCALE } from "../../lib/locale";
import {
  formatDateTime,
  formatDuration,
  formatFullDateTime,
} from "../../lib/spend-log-utils";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

function getSpendStatusBadgeClass(status) {
  const normalizedStatus = status?.toLowerCase() || "";
  if (normalizedStatus === "success" || normalizedStatus === "completed") {
    return "bg-green-500/15 text-green-700 border-green-500/30";
  }
  if (normalizedStatus === "error" || normalizedStatus === "failed") {
    return "bg-red-500/15 text-red-700 border-red-500/30";
  }
  if (normalizedStatus === "pending" || normalizedStatus === "processing") {
    return "bg-amber-500/15 text-amber-700 border-amber-500/30";
  }
  return "bg-muted text-muted-foreground";
}
export function ErrorDetailDialog({ errorLog, open, onOpenChange }) {
  if (!errorLog) return null;
  const statusCode = errorLog.status_code || 0;
  const errorType = errorLog.error_type || "Error";
  const errorMessage = errorLog.error_message || "-";
  const apiKey = errorLog.api_key;
  const spendStatus = errorLog.spend_status;
  const hasRequestKwargs =
    errorLog.request_kwargs && Object.keys(errorLog.request_kwargs).length > 0;
  const showLiteLLMModel =
    errorLog.litellm_model_name &&
    errorLog.litellm_model_name !== errorLog.model;
  return _jsx(Dialog, {
    open: open,
    onOpenChange: onOpenChange,
    children: _jsxs(DialogContent, {
      className: "sm:max-w-4xl max-h-[88vh] overflow-y-auto",
      children: [
        _jsxs(DialogHeader, {
          className: "space-y-3",
          children: [
            _jsxs("div", {
              className: "flex flex-wrap items-center gap-2",
              children: [
                _jsx(DialogTitle, {
                  className: "text-sm sm:text-base break-all",
                  children: errorType,
                }),
                _jsx(Badge, {
                  variant: "secondary",
                  className: getStatusBadgeClass(statusCode),
                  children: statusCode || "N/A",
                }),
                _jsx(Badge, {
                  variant: "secondary",
                  className: getErrorTypeBadgeClass(errorType),
                  children: errorType,
                }),
              ],
            }),
            _jsxs(DialogDescription, {
              children: [
                "Error happened at",
                " ",
                errorLog.timestamp
                  ? formatFullDateTime(errorLog.timestamp)
                  : "-",
              ],
            }),
          ],
        }),
        _jsxs("div", {
          className: "grid gap-3 sm:grid-cols-2 lg:grid-cols-3",
          children: [
            _jsxs("div", {
              className: "rounded-lg border bg-muted/20 px-3 py-2.5",
              children: [
                _jsxs("div", {
                  className:
                    "flex items-center gap-2 text-xs text-muted-foreground",
                  children: [
                    _jsx(Clock, { className: "h-3.5 w-3.5" }),
                    "Timestamp",
                  ],
                }),
                _jsx("div", {
                  className: "mt-1 text-sm font-medium",
                  children: errorLog.timestamp
                    ? formatDateTime(errorLog.timestamp)
                    : "-",
                }),
              ],
            }),
            _jsxs("div", {
              className: "rounded-lg border bg-muted/20 px-3 py-2.5",
              children: [
                _jsxs("div", {
                  className:
                    "flex items-center gap-2 text-xs text-muted-foreground",
                  children: [
                    _jsx(AlertTriangle, { className: "h-3.5 w-3.5" }),
                    "Status Code",
                  ],
                }),
                _jsx("div", {
                  className: "mt-1 text-sm font-medium",
                  children: statusCode || "N/A",
                }),
              ],
            }),
            spendStatus &&
              _jsxs("div", {
                className: "rounded-lg border bg-muted/20 px-3 py-2.5",
                children: [
                  _jsxs("div", {
                    className:
                      "flex items-center gap-2 text-xs text-muted-foreground",
                    children: [
                      _jsx(DollarSign, { className: "h-3.5 w-3.5" }),
                      "Spend Status",
                    ],
                  }),
                  _jsx("div", {
                    className: "mt-1",
                    children: _jsx(Badge, {
                      variant: "secondary",
                      className: getSpendStatusBadgeClass(spendStatus),
                      children: spendStatus,
                    }),
                  }),
                ],
              }),
            showLiteLLMModel &&
              _jsxs("div", {
                className: "rounded-lg border bg-muted/20 px-3 py-2.5",
                children: [
                  _jsxs("div", {
                    className:
                      "flex items-center gap-2 text-xs text-muted-foreground",
                    children: [
                      _jsx(Cpu, { className: "h-3.5 w-3.5" }),
                      "LiteLLM Model",
                    ],
                  }),
                  _jsx("div", {
                    className: "mt-1 text-sm font-medium font-mono break-all",
                    children: errorLog.litellm_model_name,
                  }),
                ],
              }),
          ],
        }),
        errorLog.total_tokens != null &&
          errorLog.total_tokens > 0 &&
          _jsxs("section", {
            className: "overflow-hidden rounded-lg border",
            children: [
              _jsx("div", {
                className:
                  "border-b bg-muted/30 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground",
                children: "Partial Usage (Before Error)",
              }),
              _jsxs("div", {
                className: "p-4",
                children: [
                  _jsxs("div", {
                    className: "grid gap-3 sm:grid-cols-3",
                    children: [
                      _jsxs("div", {
                        className: "rounded-lg border bg-muted/20 px-3 py-2.5",
                        children: [
                          _jsxs("div", {
                            className:
                              "flex items-center gap-2 text-xs text-muted-foreground",
                            children: [
                              _jsx(Hash, { className: "h-3.5 w-3.5" }),
                              "Tokens Used",
                            ],
                          }),
                          _jsx("div", {
                            className: "mt-1 text-sm font-medium",
                            children:
                              errorLog.total_tokens?.toLocaleString(
                                APP_LOCALE,
                              ) || "-",
                          }),
                        ],
                      }),
                      _jsxs("div", {
                        className: "rounded-lg border bg-muted/20 px-3 py-2.5",
                        children: [
                          _jsxs("div", {
                            className:
                              "flex items-center gap-2 text-xs text-muted-foreground",
                            children: [
                              _jsx(DollarSign, { className: "h-3.5 w-3.5" }),
                              "Spend Incurred",
                            ],
                          }),
                          _jsx("div", {
                            className:
                              "mt-1 text-sm font-medium text-amber-600",
                            children:
                              errorLog.spend != null
                                ? `$${errorLog.spend.toFixed(4)}`
                                : "-",
                          }),
                        ],
                      }),
                      _jsxs("div", {
                        className: "rounded-lg border bg-muted/20 px-3 py-2.5",
                        children: [
                          _jsxs("div", {
                            className:
                              "flex items-center gap-2 text-xs text-muted-foreground",
                            children: [
                              _jsx(Clock, { className: "h-3.5 w-3.5" }),
                              "Time to Error",
                            ],
                          }),
                          _jsx("div", {
                            className: "mt-1 text-sm font-medium",
                            children:
                              errorLog.end_time && errorLog.timestamp
                                ? formatDuration(
                                    new Date(errorLog.end_time).getTime() -
                                      new Date(errorLog.timestamp).getTime(),
                                  )
                                : "-",
                          }),
                        ],
                      }),
                    ],
                  }),
                  (errorLog.prompt_tokens != null ||
                    errorLog.completion_tokens != null) &&
                    _jsxs("div", {
                      className: "mt-3",
                      children: [
                        _jsxs("div", {
                          className: "flex items-center gap-4 text-xs mb-2",
                          children: [
                            _jsxs("div", {
                              className: "flex items-center gap-1.5",
                              children: [
                                _jsx("div", {
                                  className:
                                    "w-2.5 h-2.5 rounded-sm bg-blue-500",
                                }),
                                _jsxs("span", {
                                  className: "text-muted-foreground",
                                  children: [
                                    "Prompt:",
                                    " ",
                                    errorLog.prompt_tokens?.toLocaleString(
                                      APP_LOCALE,
                                    ) || "0",
                                  ],
                                }),
                              ],
                            }),
                            _jsxs("div", {
                              className: "flex items-center gap-1.5",
                              children: [
                                _jsx("div", {
                                  className:
                                    "w-2.5 h-2.5 rounded-sm bg-amber-500",
                                }),
                                _jsxs("span", {
                                  className: "text-muted-foreground",
                                  children: [
                                    "Completion:",
                                    " ",
                                    errorLog.completion_tokens?.toLocaleString(
                                      APP_LOCALE,
                                    ) || "0",
                                  ],
                                }),
                              ],
                            }),
                          ],
                        }),
                        _jsx("div", {
                          className:
                            "h-1.5 rounded-full bg-muted overflow-hidden flex",
                          children:
                            errorLog.total_tokens != null &&
                            errorLog.total_tokens > 0 &&
                            _jsxs(_Fragment, {
                              children: [
                                _jsx("div", {
                                  className:
                                    "bg-blue-500 h-full transition-all",
                                  style: {
                                    width: `${
                                      ((errorLog.prompt_tokens || 0) /
                                        errorLog.total_tokens) *
                                      100
                                    }%`,
                                  },
                                }),
                                _jsx("div", {
                                  className:
                                    "bg-amber-500 h-full transition-all",
                                  style: {
                                    width: `${
                                      ((errorLog.completion_tokens || 0) /
                                        errorLog.total_tokens) *
                                      100
                                    }%`,
                                  },
                                }),
                              ],
                            }),
                        }),
                      ],
                    }),
                ],
              }),
            ],
          }),
        _jsxs("section", {
          className: "overflow-hidden rounded-lg border",
          children: [
            _jsx("div", {
              className:
                "border-b bg-muted/30 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground",
              children: "Request Context",
            }),
            _jsxs("dl", {
              className: "divide-y divide-border",
              children: [
                _jsxs("div", {
                  className: "grid grid-cols-[120px_1fr] gap-3 px-3 py-2.5",
                  children: [
                    _jsxs("dt", {
                      className:
                        "flex items-center gap-2 text-xs text-muted-foreground",
                      children: [
                        _jsx(KeyRound, { className: "h-3.5 w-3.5" }),
                        "Request ID",
                      ],
                    }),
                    _jsx("dd", {
                      className: "font-mono text-xs break-all",
                      children: errorLog.id || "-",
                    }),
                  ],
                }),
                _jsxs("div", {
                  className: "grid grid-cols-[120px_1fr] gap-3 px-3 py-2.5",
                  children: [
                    _jsxs("dt", {
                      className:
                        "flex items-center gap-2 text-xs text-muted-foreground",
                      children: [
                        _jsx(Cpu, { className: "h-3.5 w-3.5" }),
                        "Model",
                      ],
                    }),
                    _jsx("dd", {
                      className: "text-sm break-all font-mono",
                      children: errorLog.model || "-",
                    }),
                  ],
                }),
                _jsxs("div", {
                  className: "grid grid-cols-[120px_1fr] gap-3 px-3 py-2.5",
                  children: [
                    _jsxs("dt", {
                      className:
                        "flex items-center gap-2 text-xs text-muted-foreground",
                      children: [
                        _jsx(User, { className: "h-3.5 w-3.5" }),
                        "User",
                      ],
                    }),
                    _jsx("dd", {
                      className: "text-sm break-all",
                      children: errorLog.user || "-",
                    }),
                  ],
                }),
                apiKey &&
                  _jsxs("div", {
                    className: "grid grid-cols-[120px_1fr] gap-3 px-3 py-2.5",
                    children: [
                      _jsxs("dt", {
                        className:
                          "flex items-center gap-2 text-xs text-muted-foreground",
                        children: [
                          _jsx(KeyRound, { className: "h-3.5 w-3.5" }),
                          "API Key",
                        ],
                      }),
                      _jsx("dd", {
                        className: "font-mono text-xs break-all",
                        children: apiKey,
                      }),
                    ],
                  }),
              ],
            }),
          ],
        }),
        _jsxs("section", {
          className: "overflow-hidden rounded-lg border",
          children: [
            _jsx("div", {
              className:
                "border-b bg-muted/30 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground",
              children: "Error Message",
            }),
            _jsx("div", {
              className: "px-3 py-3",
              children: _jsx("pre", {
                className:
                  "text-sm whitespace-pre-wrap wrap-break-word font-sans",
                children: errorMessage,
              }),
            }),
          ],
        }),
        hasRequestKwargs &&
          _jsxs("section", {
            className: "overflow-hidden rounded-lg border",
            children: [
              _jsx("div", {
                className:
                  "border-b bg-muted/30 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground",
                children: _jsxs("div", {
                  className: "flex items-center gap-2",
                  children: [
                    _jsx(Code2, { className: "h-3.5 w-3.5" }),
                    "Request Parameters",
                  ],
                }),
              }),
              _jsx("div", {
                className: "px-3 py-3",
                children: _jsx("pre", {
                  className:
                    "max-h-80 overflow-auto rounded bg-muted/50 p-3 text-xs whitespace-pre-wrap wrap-break-word font-mono",
                  children: JSON.stringify(errorLog.request_kwargs, null, 2),
                }),
              }),
            ],
          }),
      ],
    }),
  });
}
