"use client";
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Fragment as _Fragment,
  jsx as _jsx,
  jsxs as _jsxs,
} from "react/jsx-runtime";
import { AgentConfigEditorExecutionSection } from "./agent-config-editor/agent-config-editor-execution-section";
import { AgentConfigEditorPermissionsSection } from "./agent-config-editor/agent-config-editor-permissions-section";
import {
  AgentConfigEditorBasicSection,
  AgentConfigEditorModelSection,
  AgentConfigEditorPromptsSection,
} from "./agent-config-editor/agent-config-editor-primary-sections";
import { normalizeAgentConfig } from "./agent-config-editor/normalize";
import {
  addSkill as addSkillFn,
  removeSkill as removeSkillFn,
} from "./agent-config-editor/skill-utils";
import {
  addTool as addToolFn,
  removeTool as removeToolFn,
  updateToolValue as updateToolValueFn,
} from "./agent-config-editor/tool-utils";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
export function AgentConfigEditor({
  open,
  onOpenChange,
  agentKey,
  initialConfig = {},
  onSave,
  saving = false,
  error,
}) {
  const [activeTab, setActiveTab] = useState("overview");
  const [config, setConfig] = useState(() =>
    normalizeAgentConfig(initialConfig),
  );
  const [newSkill, setNewSkill] = useState("");
  const [newToolKey, setNewToolKey] = useState("");
  const [newToolValue, setNewToolValue] = useState(true);
  useEffect(() => {
    const normalized = normalizeAgentConfig(initialConfig);
    setConfig((prev) => {
      if (JSON.stringify(prev) !== JSON.stringify(normalized)) {
        return normalized;
      }
      return prev;
    });
  }, [initialConfig]);
  useEffect(() => {
    if (!open) return;
    setActiveTab("overview");
  }, [open]);
  const updateConfig = (field, value) => {
    setConfig((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  const addSkill = () =>
    addSkillFn(config.skills, newSkill, updateConfig, setNewSkill);
  const removeSkill = (index) =>
    removeSkillFn(config.skills, index, updateConfig);
  const addTool = () =>
    addToolFn(
      config.tools,
      newToolKey,
      newToolValue,
      updateConfig,
      setNewToolKey,
    );
  const removeTool = (key) => removeToolFn(config.tools, key, updateConfig);
  const updateToolValue = (key, value) =>
    updateToolValueFn(config.tools, key, value, updateConfig);
  const handleSave = async () => {
    await onSave(config);
  };
  return _jsx(Dialog, {
    open: open,
    onOpenChange: onOpenChange,
    children: _jsxs(DialogContent, {
      className: "max-w-3xl max-h-[90vh] overflow-y-auto",
      children: [
        _jsxs(DialogHeader, {
          children: [
            _jsxs(DialogTitle, {
              children: ["Edit Agent Configuration: ", agentKey],
            }),
            _jsxs(DialogDescription, {
              className: "sr-only",
              children: ["Edit configuration for ", agentKey, " agent"],
            }),
          ],
        }),
        error &&
          _jsx("div", {
            className:
              "p-4 bg-destructive/10 border border-destructive rounded-md text-destructive",
            children: error,
          }),
        _jsxs(Tabs, {
          value: activeTab,
          onValueChange: (value) => setActiveTab(value),
          className: "py-4",
          children: [
            _jsxs(TabsList, {
              variant: "line",
              className:
                "h-auto w-full flex-wrap justify-start rounded-xl bg-muted/35 p-1",
              children: [
                _jsx(TabsTrigger, { value: "overview", children: "Overview" }),
                _jsx(TabsTrigger, { value: "model", children: "Model" }),
                _jsx(TabsTrigger, { value: "prompts", children: "Prompts" }),
                _jsx(TabsTrigger, {
                  value: "execution",
                  children: "Execution",
                }),
                _jsx(TabsTrigger, {
                  value: "permissions",
                  children: "Permissions",
                }),
              ],
            }),
            _jsx(TabsContent, {
              value: "overview",
              className: "mt-4",
              children: _jsx("div", {
                className: "rounded-xl border bg-card p-4",
                children: _jsx(AgentConfigEditorBasicSection, {
                  config: config,
                  onUpdateConfig: updateConfig,
                }),
              }),
            }),
            _jsx(TabsContent, {
              value: "model",
              className: "mt-4",
              children: _jsx("div", {
                className: "rounded-xl border bg-card p-4",
                children: _jsx(AgentConfigEditorModelSection, {
                  agentKey: agentKey,
                  config: config,
                  onUpdateConfig: updateConfig,
                }),
              }),
            }),
            _jsx(TabsContent, {
              value: "prompts",
              className: "mt-4",
              children: _jsx("div", {
                className: "rounded-xl border bg-card p-4",
                children: _jsx(AgentConfigEditorPromptsSection, {
                  config: config,
                  onUpdateConfig: updateConfig,
                }),
              }),
            }),
            _jsx(TabsContent, {
              value: "execution",
              className: "mt-4",
              children: _jsx("div", {
                className: "rounded-xl border bg-card p-4",
                children: _jsx(AgentConfigEditorExecutionSection, {
                  config: config,
                  newSkill: newSkill,
                  newToolKey: newToolKey,
                  newToolValue: newToolValue,
                  onNewSkillChange: setNewSkill,
                  onNewToolKeyChange: setNewToolKey,
                  onNewToolValueChange: setNewToolValue,
                  onAddSkill: addSkill,
                  onRemoveSkill: removeSkill,
                  onAddTool: addTool,
                  onRemoveTool: removeTool,
                  onUpdateToolValue: updateToolValue,
                }),
              }),
            }),
            _jsx(TabsContent, {
              value: "permissions",
              className: "mt-4",
              children: _jsx("div", {
                className: "rounded-xl border bg-card p-4",
                children: _jsx(AgentConfigEditorPermissionsSection, {
                  config: config,
                  onUpdateConfig: updateConfig,
                }),
              }),
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
              onClick: handleSave,
              disabled: saving,
              children: saving
                ? _jsxs(_Fragment, {
                    children: [
                      _jsx(RefreshCw, {
                        className: "h-4 w-4 animate-spin me-2",
                      }),
                      "Saving...",
                    ],
                  })
                : "Save Configuration",
            }),
          ],
        }),
      ],
    }),
  });
}
