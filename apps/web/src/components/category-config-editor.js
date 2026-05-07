"use client";
import { RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Fragment as _Fragment,
  jsx as _jsx,
  jsxs as _jsxs,
} from "react/jsx-runtime";
import { CategoryConfigEditorAdvancedSection } from "./category-config-editor/category-config-editor-advanced-section";
import { CategoryConfigEditorExecutionSection } from "./category-config-editor/category-config-editor-execution-section";
import {
  CategoryConfigEditorBasicSection,
  CategoryConfigEditorModelSection,
} from "./category-config-editor/category-config-editor-primary-sections";
import { normalizeCategoryConfig } from "./category-config-editor/normalize";
import { useConfigUpdaters } from "./category-config-editor/state-utils";
import {
  addTool as addToolUtil,
  removeTool as removeToolUtil,
  updateToolValue as updateToolValueUtil,
} from "./category-config-editor/tool-utils";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
export function CategoryConfigEditor({
  open,
  onOpenChange,
  categoryKey,
  initialConfig = {},
  onSave,
  onReset,
  saving = false,
  error,
}) {
  const [resetConfirm, setResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [config, setConfig] = useState(() =>
    normalizeCategoryConfig(initialConfig),
  );
  const [newToolKey, setNewToolKey] = useState("");
  const [newToolValue, setNewToolValue] = useState(true);
  const { updateConfig, updateThinkingConfig } = useConfigUpdaters(setConfig);
  useEffect(() => {
    const normalized = normalizeCategoryConfig(initialConfig);
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
    setResetConfirm(false);
  }, [open]);
  const addTool = () => {
    addToolUtil(newToolKey, newToolValue, setConfig, setNewToolKey);
  };
  const removeTool = (key) => {
    removeToolUtil(key, setConfig);
  };
  const updateToolValue = (key, value) => {
    updateToolValueUtil(key, value, setConfig);
  };
  const handleSave = async () => {
    await onSave(config);
  };
  const handleReset = async () => {
    setResetting(true);
    try {
      await onReset();
      onOpenChange(false);
    } finally {
      setResetting(false);
      setResetConfirm(false);
    }
  };
  return _jsx(Dialog, {
    open: open,
    onOpenChange: onOpenChange,
    children: _jsxs(DialogContent, {
      className: "max-w-3xl max-h-[90vh] overflow-y-auto",
      children: [
        _jsx(DialogHeader, {
          children: _jsxs(DialogTitle, {
            children: ["Edit Category Configuration: ", categoryKey],
          }),
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
                _jsx(TabsTrigger, { value: "advanced", children: "Advanced" }),
                _jsx(TabsTrigger, {
                  value: "execution",
                  children: "Execution",
                }),
              ],
            }),
            _jsx(TabsContent, {
              value: "overview",
              className: "mt-4",
              children: _jsx("div", {
                className: "rounded-xl border bg-card p-4",
                children: _jsx(CategoryConfigEditorBasicSection, {
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
                children: _jsx(CategoryConfigEditorModelSection, {
                  categoryKey: categoryKey,
                  config: config,
                  onUpdateConfig: updateConfig,
                }),
              }),
            }),
            _jsx(TabsContent, {
              value: "advanced",
              className: "mt-4",
              children: _jsx("div", {
                className: "rounded-xl border bg-card p-4",
                children: _jsx(CategoryConfigEditorAdvancedSection, {
                  config: config,
                  onUpdateConfig: updateConfig,
                  onUpdateThinkingConfig: updateThinkingConfig,
                }),
              }),
            }),
            _jsx(TabsContent, {
              value: "execution",
              className: "mt-4",
              children: _jsx("div", {
                className: "rounded-xl border bg-card p-4",
                children: _jsx(CategoryConfigEditorExecutionSection, {
                  config: config,
                  newToolKey: newToolKey,
                  newToolValue: newToolValue,
                  onUpdateConfig: updateConfig,
                  onNewToolKeyChange: setNewToolKey,
                  onNewToolValueChange: setNewToolValue,
                  onAddTool: addTool,
                  onRemoveTool: removeTool,
                  onUpdateToolValue: updateToolValue,
                }),
              }),
            }),
          ],
        }),
        _jsx(DialogFooter, {
          children: resetConfirm
            ? _jsxs(_Fragment, {
                children: [
                  _jsx("span", {
                    className: "text-sm text-muted-foreground me-2",
                    children: "Remove configuration for this category?",
                  }),
                  _jsx(Button, {
                    variant: "outline",
                    size: "sm",
                    onClick: () => setResetConfirm(false),
                    disabled: resetting,
                    children: "Cancel",
                  }),
                  _jsx(Button, {
                    variant: "destructive",
                    size: "sm",
                    onClick: handleReset,
                    disabled: resetting,
                    children: resetting
                      ? _jsxs(_Fragment, {
                          children: [
                            _jsx(RefreshCw, {
                              className: "h-4 w-4 animate-spin me-1",
                            }),
                            "Resetting...",
                          ],
                        })
                      : "Confirm Reset",
                  }),
                ],
              })
            : _jsxs(_Fragment, {
                children: [
                  _jsx(Button, {
                    variant: "outline",
                    onClick: () => onOpenChange(false),
                    children: "Cancel",
                  }),
                  _jsx(Button, {
                    variant: "ghost",
                    className: "text-muted-foreground",
                    onClick: () => setResetConfirm(true),
                    children: "Reset to default",
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
        }),
      ],
    }),
  });
}
