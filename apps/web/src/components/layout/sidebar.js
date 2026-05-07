import {
  Activity,
  Bot,
  ChevronDown,
  ChevronRight,
  FileText,
  GitBranch,
  Radar,
  Settings,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink } from "react-router-dom";
import { Card, CardContent } from "../ui/card";

function isBranch(item) {
  return "children" in item;
}
function getExpandedState(id, monitoringExpanded, modelsExpanded) {
  if (id === "monitoring") return monitoringExpanded;
  if (id === "models") return modelsExpanded;
  return false;
}
function toggleExpanded(
  id,
  setMonitoring,
  setModels,
  currentMonitoring,
  currentModels,
) {
  if (id === "monitoring") setMonitoring(!currentMonitoring);
  if (id === "models") setModels(!currentModels);
}
export function Sidebar() {
  const [monitoringExpanded, setMonitoringExpanded] = useState(false);
  const [modelsExpanded, setModelsExpanded] = useState(false);
  const navItems = [
    { to: "/", icon: Activity, label: "Dashboard" },
    { to: "/monitor", icon: Radar, label: "Monitor" },
    { to: "/model-stats", icon: TrendingUp, label: "Stats" },
    { to: "/logs", icon: FileText, label: "Logs" },
    { to: "/agent-routing", icon: Bot, label: "Agents" },
    {
      id: "models",
      icon: Settings,
      label: "Models",
      children: [
        { to: "/models", label: "Manage", icon: Settings },
        { to: "/aliases", icon: GitBranch, label: "Aliases" },
      ],
    },
  ];
  return _jsx("aside", {
    className: "w-64 min-h-screen border-l bg-muted/10 p-4",
    children: _jsx(Card, {
      children: _jsxs(CardContent, {
        className: "px-3 py-0 gap-4 flex flex-col",
        children: [
          _jsx("div", {
            className: "flex gap-1 flex-col",
            children: _jsx("h2", {
              className: "font-bold text-lg",
              children: "LiteLLM Stats",
            }),
          }),
          _jsx("nav", {
            className: "space-y-1",
            children: navItems.map((item) => {
              if (isBranch(item)) {
                const expanded = getExpandedState(
                  item.id,
                  monitoringExpanded,
                  modelsExpanded,
                );
                return _jsxs(
                  "div",
                  {
                    children: [
                      _jsxs("button", {
                        type: "button",
                        onClick: () =>
                          toggleExpanded(
                            item.id,
                            setMonitoringExpanded,
                            setModelsExpanded,
                            monitoringExpanded,
                            modelsExpanded,
                          ),
                        className: `flex items-center gap-2 px-3 py-2 rounded-md transition-colors w-full text-left ${expanded ? "bg-muted" : "hover:bg-muted"}`,
                        children: [
                          item.icon &&
                            _jsx(item.icon, { className: "h-4 w-4" }),
                          _jsx("span", {
                            className: "flex-1",
                            children: item.label,
                          }),
                          expanded
                            ? _jsx(ChevronDown, { className: "h-4 w-4" })
                            : _jsx(ChevronRight, { className: "h-4 w-4" }),
                        ],
                      }),
                      expanded &&
                        _jsx("div", {
                          className: "ml-4 mt-1 space-y-1",
                          children: item.children.map((child) =>
                            _jsxs(
                              NavLink,
                              {
                                to: child.to,
                                className: ({ isActive }) =>
                                  `flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors text-sm ${
                                    isActive
                                      ? "bg-primary text-primary-foreground"
                                      : "hover:bg-muted"
                                  }`,
                                children: [
                                  child.icon &&
                                    _jsx(child.icon, { className: "h-4 w-4" }),
                                  _jsx("span", { children: child.label }),
                                ],
                              },
                              child.to,
                            ),
                          ),
                        }),
                    ],
                  },
                  item.id,
                );
              }
              return _jsxs(
                NavLink,
                {
                  to: item.to,
                  className: ({ isActive }) =>
                    `flex items-center gap-2 px-3 py-2 rounded-md transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-muted"
                    }`,
                  children: [
                    item.icon && _jsx(item.icon, { className: "h-4 w-4" }),
                    _jsx("span", { children: item.label }),
                  ],
                },
                item.to,
              );
            }),
          }),
        ],
      }),
    }),
  });
}
