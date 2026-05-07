import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function ConnectionBadge({ status, alertCount }) {
  const colorMap = {
    connected: "bg-green-500",
    connecting: "bg-yellow-500 animate-pulse",
    reconnecting: "bg-yellow-500 animate-pulse",
    disconnected: "bg-red-500",
  };
  const labelMap = {
    connected: "Connected",
    connecting: "Connecting...",
    reconnecting: "Reconnecting...",
    disconnected: "Disconnected",
  };
  return _jsxs("div", {
    className: "flex items-center gap-2",
    children: [
      alertCount > 0 &&
        _jsxs("span", {
          className:
            "inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800",
          children: [alertCount, " active"],
        }),
      _jsxs("div", {
        className: "flex items-center gap-1.5 text-sm text-muted-foreground",
        children: [
          _jsx("span", {
            className: `h-2 w-2 rounded-full ${colorMap[status]}`,
          }),
          labelMap[status],
        ],
      }),
    ],
  });
}
