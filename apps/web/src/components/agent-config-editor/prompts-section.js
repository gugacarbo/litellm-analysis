import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
export function AgentConfigEditorPromptsSection({ config, onUpdateConfig }) {
  return _jsxs("section", {
    className: "space-y-4",
    children: [
      _jsxs("div", {
        className: "space-y-1",
        children: [
          _jsx("h3", { className: "font-semibold", children: "Prompts" }),
          _jsx("p", {
            className: "text-xs text-muted-foreground",
            children: "Prompt templates and appended context for this agent.",
          }),
        ],
      }),
      _jsxs("div", {
        className: "space-y-2",
        children: [
          _jsx(Label, { htmlFor: "prompt", children: "Prompt" }),
          _jsx(Textarea, {
            id: "prompt",
            value: config.prompt || "",
            onChange: (e) => onUpdateConfig("prompt", e.target.value),
            placeholder: "Enter prompt",
            rows: 8,
          }),
        ],
      }),
      _jsxs("div", {
        className: "space-y-2",
        children: [
          _jsx(Label, { htmlFor: "prompt_append", children: "Prompt Append" }),
          _jsx(Textarea, {
            id: "prompt_append",
            value: config.prompt_append || "",
            onChange: (e) => onUpdateConfig("prompt_append", e.target.value),
            placeholder: "Enter prompt append",
            rows: 5,
          }),
        ],
      }),
    ],
  });
}
