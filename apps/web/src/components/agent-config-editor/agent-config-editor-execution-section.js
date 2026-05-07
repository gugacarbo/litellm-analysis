import { Plus, Trash2 } from "lucide-react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
export function AgentConfigEditorExecutionSection({
  config,
  newSkill,
  newToolKey,
  newToolValue,
  onNewSkillChange,
  onNewToolKeyChange,
  onNewToolValueChange,
  onAddSkill,
  onRemoveSkill,
  onAddTool,
  onRemoveTool,
  onUpdateToolValue,
}) {
  return _jsxs("section", {
    className: "space-y-4",
    children: [
      _jsxs("div", {
        className: "space-y-1",
        children: [
          _jsx("h3", {
            className: "font-semibold",
            children: "Execution Settings",
          }),
          _jsx("p", {
            className: "text-xs text-muted-foreground",
            children: "Skills and tool permissions available for this agent.",
          }),
        ],
      }),
      _jsxs("div", {
        className: "space-y-2",
        children: [
          _jsxs("div", {
            className: "flex flex-wrap items-center justify-between gap-2",
            children: [
              _jsx(Label, { children: "Skills" }),
              _jsxs("div", {
                className: "flex items-center gap-2",
                children: [
                  _jsx(Input, {
                    value: newSkill,
                    onChange: (e) => onNewSkillChange(e.target.value),
                    placeholder: "Add skill",
                    className: "h-8 w-40",
                  }),
                  _jsx(Button, {
                    type: "button",
                    variant: "outline",
                    size: "sm",
                    onClick: onAddSkill,
                    children: _jsx(Plus, { className: "h-3 w-3" }),
                  }),
                ],
              }),
            ],
          }),
          config.skills && config.skills.length > 0
            ? _jsx("div", {
                className: "flex flex-wrap gap-2",
                children: config.skills.map((skill, index) =>
                  _jsxs(
                    Badge,
                    {
                      variant: "secondary",
                      className: "flex items-center gap-1",
                      children: [
                        skill,
                        _jsx(Button, {
                          type: "button",
                          variant: "ghost",
                          size: "sm",
                          className: "ml-1 h-4 w-4 p-0",
                          onClick: () => onRemoveSkill(index),
                          children: _jsx(Trash2, { className: "h-3 w-3" }),
                        }),
                      ],
                    },
                    `${skill}-${index}`,
                  ),
                ),
              })
            : _jsx("p", {
                className: "text-sm text-muted-foreground",
                children: "No skills configured",
              }),
        ],
      }),
      _jsxs("div", {
        className: "space-y-2",
        children: [
          _jsxs("div", {
            className: "flex flex-wrap items-center justify-between gap-2",
            children: [
              _jsx(Label, { children: "Tools" }),
              _jsxs("div", {
                className: "flex flex-wrap items-center gap-2",
                children: [
                  _jsx(Input, {
                    value: newToolKey,
                    onChange: (e) => onNewToolKeyChange(e.target.value),
                    placeholder: "Key",
                    className: "h-8 w-32",
                  }),
                  _jsxs(Select, {
                    value: newToolValue.toString(),
                    onValueChange: (value) =>
                      onNewToolValueChange(value === "true"),
                    children: [
                      _jsx(SelectTrigger, {
                        className: "h-8 w-24",
                        children: _jsx(SelectValue, {}),
                      }),
                      _jsxs(SelectContent, {
                        children: [
                          _jsx(SelectItem, {
                            value: "true",
                            children: "Enabled",
                          }),
                          _jsx(SelectItem, {
                            value: "false",
                            children: "Disabled",
                          }),
                        ],
                      }),
                    ],
                  }),
                  _jsx(Button, {
                    type: "button",
                    variant: "outline",
                    size: "sm",
                    onClick: onAddTool,
                    children: _jsx(Plus, { className: "h-3 w-3" }),
                  }),
                ],
              }),
            ],
          }),
          config.tools && Object.keys(config.tools).length > 0
            ? _jsx("div", {
                className: "space-y-2",
                children: Object.entries(config.tools).map(([key, value]) =>
                  _jsxs(
                    "div",
                    {
                      className: "flex items-center gap-2",
                      children: [
                        _jsx(Badge, {
                          variant: "secondary",
                          className: "px-2 py-1",
                          children: key,
                        }),
                        _jsxs(Select, {
                          value: value.toString(),
                          onValueChange: (v) =>
                            onUpdateToolValue(key, v === "true"),
                          children: [
                            _jsx(SelectTrigger, {
                              className: "h-8 w-24",
                              children: _jsx(SelectValue, {}),
                            }),
                            _jsxs(SelectContent, {
                              children: [
                                _jsx(SelectItem, {
                                  value: "true",
                                  children: "Enabled",
                                }),
                                _jsx(SelectItem, {
                                  value: "false",
                                  children: "Disabled",
                                }),
                              ],
                            }),
                          ],
                        }),
                        _jsx(Button, {
                          type: "button",
                          variant: "outline",
                          size: "sm",
                          onClick: () => onRemoveTool(key),
                          children: _jsx(Trash2, { className: "h-3 w-3" }),
                        }),
                      ],
                    },
                    key,
                  ),
                ),
              })
            : _jsx("p", {
                className: "text-sm text-muted-foreground",
                children: "No tools configured",
              }),
        ],
      }),
    ],
  });
}
