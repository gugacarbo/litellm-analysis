import { useIsFetching } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "./button";
export function ReloadButton({ onClick, label = "Refresh" }) {
  const isFetching = useIsFetching() > 0;
  return _jsxs(Button, {
    variant: "outline",
    size: "sm",
    className: "h-7 px-2 text-xs",
    onClick: onClick,
    children: [
      _jsx(RefreshCw, {
        className: `mr-1.5 h-3 w-3 ${isFetching ? "animate-spin" : ""}`,
      }),
      label,
    ],
  });
}
