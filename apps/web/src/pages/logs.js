import { useQuery } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useSearchParams } from "react-router-dom";
import { PageLayout } from "../components/ui/page-layout";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { useLogs } from "../hooks/use-logs";
import { getAllModels } from "../lib/api-client/models";
import { queryKeys } from "../lib/query-keys";
import { SpendLogsTab } from "./logs/spend-logs-tab";
import { LogsErrorsTab } from "./logs-errors-tab";
export function LogsPage() {
  const {
    logs,
    pagination,
    loading,
    refreshing,
    error,
    page,
    pageSize,
    filters,
    setPage,
    setPageSize,
    setFilters,
    refetch,
  } = useLogs();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") === "errors" ? "errors" : "spend";
  const handleTabChange = (tab) => {
    if (tab === "errors") {
      setSearchParams({ tab: "errors" });
    } else {
      setSearchParams({});
    }
  };
  const modelsQuery = useQuery({
    queryKey: queryKeys.models,
    queryFn: getAllModels,
  });
  return _jsx(PageLayout, {
    title: "Logs & Errors",
    subtitle: "Request-level costs, usage, and latency diagnostics.",
    icon: FileText,
    filters: DEBUG_LOCALE
      ? _jsxs("div", {
          className:
            "rounded-lg border border-dashed border-amber-500/50 bg-amber-500/10 px-3 py-1.5 text-xs font-mono text-amber-700 dark:text-amber-400",
          children: [
            _jsx("span", { className: "font-semibold", children: "DEBUG:" }),
            " ",
            _jsxs("span", {
              className: "mr-3",
              children: ["locale=", APP_LOCALE],
            }),
            _jsxs("span", { children: ["tz=", APP_TIMEZONE] }),
          ],
        })
      : undefined,
    children: _jsxs(Tabs, {
      value: activeTab,
      onValueChange: handleTabChange,
      children: [
        _jsxs(TabsList, {
          children: [
            _jsx(TabsTrigger, { value: "spend", children: "Logs" }),
            _jsx(TabsTrigger, { value: "errors", children: "Error Logs" }),
          ],
        }),
        _jsx(TabsContent, {
          value: "spend",
          className: "mt-6",
          children: _jsx(SpendLogsTab, {
            logs: logs,
            pagination: pagination,
            loading: loading,
            refreshing: refreshing,
            error: error,
            modelsQuery: modelsQuery,
            page: page,
            pageSize: pageSize,
            filters: filters,
            setPage: setPage,
            setPageSize: setPageSize,
            setFilters: setFilters,
            refetch: refetch,
          }),
        }),
        _jsx(TabsContent, {
          value: "errors",
          className: "mt-6",
          children: _jsx(LogsErrorsTab, {}),
        }),
      ],
    }),
  });
}

import { APP_LOCALE, APP_TIMEZONE, DEBUG_LOCALE } from "@/lib/locale";
