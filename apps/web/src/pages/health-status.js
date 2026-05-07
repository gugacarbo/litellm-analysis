import { Activity, History, Loader2 } from "lucide-react";
import { useState } from "react";
import {
  Fragment as _Fragment,
  jsx as _jsx,
  jsxs as _jsxs,
} from "react/jsx-runtime";
import { HistoryTable } from "../components/health-status/history-table";
import { ModelsTable } from "../components/health-status/models-table";
import { StatusDetailsDialog } from "../components/health-status/status-details-dialog";
import { Button } from "../components/ui/button";
import { Dialog } from "../components/ui/dialog";
import { PageLayout } from "../components/ui/page-layout";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { STATUS_COLORS } from "./health-status/health-status-utils";
import { useHealthStatusPage } from "./health-status/use-health-status-page";

function SmallStat({ label, value, color }) {
  return _jsxs("div", {
    className: "rounded-md border bg-card px-3 py-2",
    children: [
      _jsx("div", {
        className: "text-[11px] uppercase tracking-wide text-muted-foreground",
        children: label,
      }),
      _jsx("div", {
        className: "text-base font-semibold tabular-nums",
        style: { color },
        children: value,
      }),
    ],
  });
}
export function HealthStatusContent({ embedded = false }) {
  const { state, actions, derived } = useHealthStatusPage();
  const [activeTab, setActiveTab] = useState("models");
  const [selectedStatus, setSelectedStatus] = useState(null);
  const total = derived.sorted.length;
  const totalHistory = state.resultsQuery.data?.total ?? 0;
  const healthPercent =
    total > 0 ? `${Math.round((derived.healthyCount / total) * 100)}%` : "0%";
  const historyPage =
    state.resultsLimit > 0
      ? Math.floor(state.resultsOffset / state.resultsLimit) + 1
      : 1;
  const totalPages =
    state.resultsLimit > 0 ? Math.ceil(totalHistory / state.resultsLimit) : 1;
  const start = totalHistory > 0 ? state.resultsOffset + 1 : 0;
  const end = Math.min(state.resultsOffset + state.resultsLimit, totalHistory);
  const runHealthCheckButton = _jsx(Button, {
    size: "sm",
    variant: "secondary",
    onClick: () => actions.triggerRun(),
    disabled: actions.isGlobalRunning,
    children: actions.isGlobalRunning
      ? _jsxs(_Fragment, {
          children: [
            _jsx(Loader2, { className: "size-3.5 animate-spin" }),
            "Running...",
          ],
        })
      : "Run Health Check",
  });
  const content = _jsxs("div", {
    className: "space-y-4",
    children: [
      _jsx(Dialog, {
        open: selectedStatus !== null,
        onOpenChange: (open) => {
          if (!open) setSelectedStatus(null);
        },
        children: _jsx(StatusDetailsDialog, { selected: selectedStatus }),
      }),
      _jsxs("div", {
        className: "grid grid-cols-2 gap-2 md:grid-cols-5",
        children: [
          _jsx(SmallStat, {
            label: "Coverage",
            value: healthPercent,
            color: "#0ea5e9",
          }),
          _jsx(SmallStat, {
            label: "Healthy",
            value: derived.healthyCount,
            color: STATUS_COLORS.healthy,
          }),
          _jsx(SmallStat, {
            label: "Unhealthy",
            value: derived.unhealthyCount,
            color: STATUS_COLORS.unhealthy,
          }),
          _jsx(SmallStat, {
            label: "Errors",
            value: derived.errorCount,
            color: STATUS_COLORS.error,
          }),
          _jsx(SmallStat, {
            label: "Unknown",
            value: derived.unknownCount,
            color: "#94a3b8",
          }),
        ],
      }),
      _jsxs(Tabs, {
        value: activeTab,
        onValueChange: (value) => setActiveTab(value),
        children: [
          _jsxs("div", {
            className: "flex items-center justify-between gap-2",
            children: [
              _jsxs(TabsList, {
                children: [
                  _jsxs(TabsTrigger, {
                    value: "models",
                    children: [
                      _jsx(Activity, { className: "size-3.5" }),
                      "Models (",
                      total,
                      ")",
                    ],
                  }),
                  _jsxs(TabsTrigger, {
                    value: "history",
                    children: [
                      _jsx(History, { className: "size-3.5" }),
                      "History",
                    ],
                  }),
                ],
              }),
              runHealthCheckButton,
            ],
          }),
          _jsx(TabsContent, {
            value: "models",
            className: "pt-1",
            children: _jsx(ModelsTable, {
              models: derived.sorted,
              isLoading: state.latestQuery.isLoading,
              isError: state.latestQuery.isError,
              isGlobalRunning: actions.isGlobalRunning,
              isModelRunning: actions.isModelRunning,
              onSelect: setSelectedStatus,
              onTest: actions.triggerSingleRun,
            }),
          }),
          _jsx(TabsContent, {
            value: "history",
            className: "pt-1",
            children: _jsx(HistoryTable, {
              entries: state.resultsQuery.data?.checks ?? [],
              isLoading: state.resultsQuery.isLoading,
              isError: state.resultsQuery.isError,
              total: totalHistory,
              offset: state.resultsOffset,
              page: historyPage,
              totalPages: totalPages,
              start: start,
              end: end,
              onSelect: setSelectedStatus,
              onPrevPage: () =>
                state.setResultsOffset(
                  Math.max(0, state.resultsOffset - state.resultsLimit),
                ),
              onNextPage: () =>
                state.setResultsOffset(
                  state.resultsOffset + state.resultsLimit,
                ),
            }),
          }),
        ],
      }),
    ],
  });
  if (embedded) return content;
  return _jsx(PageLayout, {
    title: "Health Check",
    subtitle: "Model status and probe history",
    icon: Activity,
    children: content,
  });
}
export function HealthStatusPage() {
  return _jsx(HealthStatusContent, {});
}
