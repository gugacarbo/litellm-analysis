import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

function PermissionField({ label, id, value, onChange }) {
  return _jsxs("div", {
    className: "space-y-2",
    children: [
      _jsx(Label, { htmlFor: id, children: label }),
      _jsxs(Select, {
        value: value,
        onValueChange: onChange,
        children: [
          _jsx(SelectTrigger, { children: _jsx(SelectValue, {}) }),
          _jsxs(SelectContent, {
            children: [
              _jsx(SelectItem, { value: "ask", children: "Ask" }),
              _jsx(SelectItem, { value: "allow", children: "Allow" }),
              _jsx(SelectItem, { value: "deny", children: "Deny" }),
            ],
          }),
        ],
      }),
    ],
  });
}
export function AgentConfigEditorPermissionsSection({
  config,
  onUpdateConfig,
}) {
  const perm = config.permission || {};
  function updatePerm(field, value) {
    onUpdateConfig("permission", { ...perm, [field]: value });
  }
  return _jsxs("section", {
    className: "space-y-4",
    children: [
      _jsxs("div", {
        className: "space-y-1",
        children: [
          _jsx("h3", { className: "font-semibold", children: "Permissions" }),
          _jsx("p", {
            className: "text-xs text-muted-foreground",
            children:
              "Default behavior for edit, shell and web-related operations.",
          }),
        ],
      }),
      _jsxs("div", {
        className: "grid grid-cols-1 gap-4 md:grid-cols-2",
        children: [
          _jsx(PermissionField, {
            label: "Edit",
            id: "perm-edit",
            value: perm.edit || "ask",
            onChange: (v) => updatePerm("edit", v),
          }),
          _jsx(PermissionField, {
            label: "Bash",
            id: "perm-bash",
            value: typeof perm.bash === "string" ? perm.bash : "ask",
            onChange: (v) => updatePerm("bash", v),
          }),
          _jsx(PermissionField, {
            label: "Webfetch",
            id: "perm-webfetch",
            value: perm.webfetch || "ask",
            onChange: (v) => updatePerm("webfetch", v),
          }),
          _jsx(PermissionField, {
            label: "Doom Loop",
            id: "perm-doom_loop",
            value: perm.doom_loop || "ask",
            onChange: (v) => updatePerm("doom_loop", v),
          }),
          _jsx(PermissionField, {
            label: "External Directory",
            id: "perm-external_directory",
            value: perm.external_directory || "ask",
            onChange: (v) => updatePerm("external_directory", v),
          }),
        ],
      }),
    ],
  });
}
