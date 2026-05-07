import { RefreshCw } from "lucide-react";
import {
  Fragment as _Fragment,
  jsx as _jsx,
  jsxs as _jsxs,
} from "react/jsx-runtime";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Input } from "../ui/input";
export function AgentRoutingAliasDialog({
  open,
  mode,
  saving,
  aliasKey,
  aliasValue,
  onOpenChange,
  onAliasKeyChange,
  onAliasValueChange,
  onSave,
}) {
  return _jsx(Dialog, {
    open: open,
    onOpenChange: onOpenChange,
    children: _jsxs(DialogContent, {
      className: "sm:max-w-md",
      children: [
        _jsxs(DialogHeader, {
          children: [
            _jsx(DialogTitle, {
              children:
                mode === "add" ? "Add Custom Alias" : "Edit Custom Alias",
            }),
            _jsx(DialogDescription, {
              className: "sr-only",
              children:
                mode === "add"
                  ? "Add a new custom alias for routing."
                  : "Edit an existing custom alias.",
            }),
          ],
        }),
        _jsxs("div", {
          className: "grid gap-4 py-4",
          children: [
            _jsxs("div", {
              className: "grid gap-2",
              children: [
                _jsx("label", {
                  htmlFor: "alias-key",
                  className: "text-sm font-medium",
                  children: "Alias",
                }),
                _jsx(Input, {
                  id: "alias-key",
                  value: aliasKey,
                  onChange: (e) => onAliasKeyChange(e.target.value),
                  placeholder: "e.g. my-model-alias",
                  disabled: mode === "edit",
                }),
              ],
            }),
            _jsxs("div", {
              className: "grid gap-2",
              children: [
                _jsx("label", {
                  htmlFor: "alias-value",
                  className: "text-sm font-medium",
                  children: "Routes To",
                }),
                _jsx(Input, {
                  id: "alias-value",
                  value: aliasValue,
                  onChange: (e) => onAliasValueChange(e.target.value),
                  placeholder: "e.g. gpt-4",
                }),
              ],
            }),
          ],
        }),
        _jsxs(DialogFooter, {
          children: [
            _jsx(Button, {
              variant: "outline",
              onClick: () => onOpenChange(false),
              children: "Cancel",
            }),
            _jsx(Button, {
              onClick: onSave,
              disabled: saving || !aliasKey.trim() || !aliasValue.trim(),
              children: saving
                ? _jsxs(_Fragment, {
                    children: [
                      _jsx(RefreshCw, {
                        className: "h-4 w-4 animate-spin me-2",
                      }),
                      "Saving...",
                    ],
                  })
                : "Save",
            }),
          ],
        }),
      ],
    }),
  });
}
