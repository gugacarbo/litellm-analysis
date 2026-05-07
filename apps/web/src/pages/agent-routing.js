"use client";
import { Database, Layers, RefreshCw, Settings } from "lucide-react";
import {
  Fragment as _Fragment,
  jsx as _jsx,
  jsxs as _jsxs,
} from "react/jsx-runtime";
import { AgentConfigEditor } from "../components/agent-config-editor";
import { AgentRoutingAgentsTab } from "../components/agent-routing/agent-routing-agents-tab";
import { AgentRoutingCategoriesTab } from "../components/agent-routing/agent-routing-categories-tab";
import { AgentRoutingModelStationsTab } from "../components/agent-routing/agent-routing-model-stations-tab";
import { CategoryConfigEditor } from "../components/category-config-editor";
import { GlobalFallbackSelector } from "../components/global-fallback-selector";
import { Button } from "../components/ui/button";
import { PageLayout } from "../components/ui/page-layout";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { useAgentRoutingPageState } from "./agent-routing/use-agent-routing-page";
export function AgentRoutingPage() {
  const state = useAgentRoutingPageState();
  return _jsxs(PageLayout, {
    title: "Agent Routing",
    subtitle: "Configure models for agents and categories",
    icon: Settings,
    buttons: _jsx(Button, {
      onClick: state.handleSaveAll,
      disabled: state.saving || state.loading,
      children: state.saving
        ? _jsxs(_Fragment, {
            children: [
              _jsx(RefreshCw, { className: "h-4 w-4 animate-spin me-2" }),
              "Saving...",
            ],
          })
        : _jsxs(_Fragment, {
            children: [
              _jsx(Database, { className: "h-4 w-4 me-2" }),
              "Save All",
            ],
          }),
    }),
    children: [
      _jsxs(Tabs, {
        defaultValue: "agents",
        children: [
          _jsxs("div", {
            className: "flex items-center justify-between",
            children: [
              _jsxs(TabsList, {
                children: [
                  _jsx(TabsTrigger, { value: "agents", children: "Agents" }),
                  _jsx(TabsTrigger, {
                    value: "categories",
                    children: "Categories",
                  }),
                  _jsxs(TabsTrigger, {
                    value: "model-stations",
                    children: [
                      _jsx(Layers, { className: "h-4 w-4 me-1.5" }),
                      "Model Stations",
                    ],
                  }),
                ],
              }),
              _jsx(GlobalFallbackSelector, {
                value: state.globalFallbackModel,
                onValueChange: state.handleSaveGlobalFallback,
              }),
            ],
          }),
          _jsx(TabsContent, {
            value: "agents",
            className: "mt-4",
            children: _jsx(AgentRoutingAgentsTab, {
              loading: state.loading,
              agents: state.agents,
              models: state.models,
              onOpenAgentConfig: state.openAgentConfig,
              onQuickModelChange: state.handleQuickModelChange,
              getAgentConfigInfo: state.getAgentConfigInfo,
            }),
          }),
          _jsx(TabsContent, {
            value: "categories",
            className: "mt-4",
            children: _jsx(AgentRoutingCategoriesTab, {
              loading: state.loading,
              categories: state.categories,
              models: state.models,
              onOpenCategoryConfig: state.openCategoryConfig,
              onQuickModelChange: state.handleQuickCategoryModelChange,
              getCategoryConfigInfo: state.getCategoryConfigInfo,
            }),
          }),
          _jsx(TabsContent, {
            value: "model-stations",
            className: "mt-4",
            children: _jsx(AgentRoutingModelStationsTab, {
              loading: state.loading,
              agents: state.agents,
              categories: state.categories,
              models: state.models,
              onOpenAgentConfig: state.openAgentConfig,
              onOpenCategoryConfig: state.openCategoryConfig,
              getAgentConfigInfo: state.getAgentConfigInfo,
              getCategoryConfigInfo: state.getCategoryConfigInfo,
            }),
          }),
        ],
      }),
      _jsx(AgentConfigEditor, {
        open: state.agentConfigDialogOpen,
        onOpenChange: state.setAgentConfigDialogOpen,
        agentKey: state.editingAgentKey,
        initialConfig: state.resolvedAgentConfigs[state.editingAgentKey],
        onSave: state.handleSaveAgentConfig,
        saving: state.saving,
        error: state.error,
      }),
      _jsx(CategoryConfigEditor, {
        open: state.categoryConfigDialogOpen,
        onOpenChange: state.setCategoryConfigDialogOpen,
        categoryKey: state.editingCategoryKey,
        initialConfig: state.resolvedCategoryConfigs[state.editingCategoryKey],
        onSave: state.handleSaveCategoryConfig,
        onReset: () =>
          state.handleDeleteCategoryConfig(state.editingCategoryKey),
        saving: state.saving,
        error: state.error,
      }),
    ],
  });
}
export default AgentRoutingPage;
