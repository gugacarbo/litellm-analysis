import { ArrowLeft, RefreshCw, TrendingUp } from "lucide-react";
import { useCallback, useMemo } from "react";
import {
  Fragment as _Fragment,
  jsx as _jsx,
  jsxs as _jsxs,
} from "react/jsx-runtime";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { APP_LOCALE, APP_TIMEZONE } from "@/lib/locale";
import { ModelDetailApiKeyTable } from "../components/model-detail/model-detail-api-key-table";
import { ModelDetailCostChart } from "../components/model-detail/model-detail-cost-chart";
import { ModelDetailErrorBreakdown } from "../components/model-detail/model-detail-error-breakdown";
import { ModelDetailErrorTrendChart } from "../components/model-detail/model-detail-error-trend-chart";
import { ModelDetailHourlyChart } from "../components/model-detail/model-detail-hourly-chart";
import { ModelDetailLatencyChart } from "../components/model-detail/model-detail-latency-chart";
import { ModelDetailProviderChart } from "../components/model-detail/model-detail-provider-chart";
import { ModelDetailStatusChart } from "../components/model-detail/model-detail-status-chart";
import { ModelDetailSummaryCards } from "../components/model-detail/model-detail-summary-cards";
import { ModelDetailTokenEfficiency } from "../components/model-detail/model-detail-token-efficiency";
import { ModelDetailTrendChart } from "../components/model-detail/model-detail-trend-chart";
import { ModelDetailTTFTChart } from "../components/model-detail/model-detail-ttft-chart";
import { ModelDetailUserTable } from "../components/model-detail/model-detail-user-table";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { PageLayout } from "../components/ui/page-layout";
import { Separator } from "../components/ui/separator";
import { TimeRangePicker } from "../components/ui/time-range-picker";
import { useModelDetailData } from "../hooks/use-model-detail-data";
import { getDateRangeDays } from "./dashboard/dashboard-utils";

function getRangeLabel(rangeKey, fromIso, toIso) {
  const labels = {
    "1h": "Last hour",
    "6h": "Last 6 hours",
    "24h": "Last 24 hours",
    today: "Today",
    "7d": "Last 7 days",
    "30d": "Last 30 days",
    "60d": "Last 60 days",
    "90d": "Last 90 days",
    all: "All time",
  };
  if (rangeKey === "custom" && fromIso && toIso) {
    const from = new Date(fromIso).toLocaleDateString(APP_LOCALE, {
      timeZone: APP_TIMEZONE,
    });
    const to = new Date(toIso).toLocaleDateString(APP_LOCALE, {
      timeZone: APP_TIMEZONE,
    });
    return `${from} — ${to}`;
  }
  return labels[rangeKey] ?? rangeKey;
}
export function ModelDetailPage() {
  const { modelName } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const rangeKey = searchParams.get("range") ?? "30d";
  const fromIso = searchParams.get("from");
  const toIso = searchParams.get("to");
  const days = useMemo(() => {
    if (rangeKey === "custom" && fromIso && toIso) {
      const diffMs = new Date(toIso).getTime() - new Date(fromIso).getTime();
      return Math.max(0, diffMs / (1000 * 60 * 60 * 24));
    }
    return getDateRangeDays(rangeKey);
  }, [rangeKey, fromIso, toIso]);
  const rangeLabel = useMemo(
    () => getRangeLabel(rangeKey, fromIso, toIso),
    [rangeKey, fromIso, toIso],
  );
  const timeRangeValue = useMemo(() => {
    if (rangeKey === "custom" && fromIso && toIso) {
      return { preset: "custom", from: new Date(fromIso), to: new Date(toIso) };
    }
    return { preset: rangeKey };
  }, [rangeKey, fromIso, toIso]);
  const handleTimeRangeChange = useCallback(
    (newValue) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          if (newValue.preset === "custom" && newValue.from && newValue.to) {
            params.set("range", "custom");
            params.set("from", newValue.from.toISOString());
            params.set("to", newValue.to.toISOString());
          } else if (newValue.preset) {
            params.set("range", newValue.preset);
            params.delete("from");
            params.delete("to");
          }
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );
  const {
    summary,
    dailySpendTrend,
    dailyTokenTrend,
    latencyTrend,
    errorBreakdown,
    dailyErrorTrend,
    hourlyUsage,
    topUsers,
    topApiKeys,
    cacheHitRate,
    ttft,
    statusDistribution,
    providerBreakdown,
    loading,
    error,
  } = useModelDetailData(modelName ?? "", days);
  if (!modelName) {
    return _jsx("div", {
      className: "p-6",
      children: _jsx("p", {
        className: "text-muted-foreground",
        children: "Model not specified",
      }),
    });
  }
  return _jsxs(PageLayout, {
    title: "Model Detail",
    icon: TrendingUp,
    showFilters: false,
    buttons: _jsxs(_Fragment, {
      children: [
        _jsx(Button, {
          variant: "ghost",
          size: "sm",
          asChild: true,
          children: _jsxs(Link, {
            to: "/model-stats",
            children: [_jsx(ArrowLeft, { className: "h-4 w-4" }), "Back"],
          }),
        }),
        _jsx(Badge, {
          variant: "outline",
          className: "text-lg px-4 py-1",
          children: modelName,
        }),
        loading &&
          _jsx(RefreshCw, {
            className: "h-4 w-4 animate-spin text-muted-foreground",
          }),
      ],
    }),
    children: [
      _jsx("div", {
        className: "flex items-center justify-between flex-wrap gap-2",
        children: _jsx(TimeRangePicker, {
          value: timeRangeValue,
          onChange: handleTimeRangeChange,
        }),
      }),
      _jsxs("p", {
        className: "text-sm text-muted-foreground",
        children: ["Showing data for ", rangeLabel],
      }),
      error &&
        _jsx("div", {
          className:
            "bg-destructive/10 border border-destructive/20 rounded-lg p-4",
          children: _jsxs("p", {
            className: "text-sm text-destructive",
            children: ["Error loading data: ", error],
          }),
        }),
      _jsx(ModelDetailSummaryCards, {
        summary: summary,
        cacheHitRate: cacheHitRate,
        ttft: ttft,
        loading: loading,
        days: Math.max(1, days),
      }),
      _jsxs("section", {
        children: [
          _jsx("h2", {
            className: "text-lg font-semibold border-b border-border pb-2 mb-4",
            children: "Cost Analysis",
          }),
          _jsx("div", {
            className: "grid grid-cols-1 lg:grid-cols-2 gap-6",
            children: _jsx(ModelDetailCostChart, {
              data: dailySpendTrend,
              loading: loading,
              rangeLabel: rangeLabel,
            }),
          }),
        ],
      }),
      _jsx(Separator, {}),
      _jsxs("section", {
        children: [
          _jsx("h2", {
            className: "text-lg font-semibold border-b border-border pb-2 mb-4",
            children: "Token Analytics",
          }),
          _jsx("div", {
            className: "grid grid-cols-1 lg:grid-cols-2 gap-6",
            children: _jsx(ModelDetailTokenEfficiency, {
              data: dailyTokenTrend,
              loading: loading,
              rangeLabel: rangeLabel,
            }),
          }),
        ],
      }),
      _jsx(Separator, {}),
      _jsxs("section", {
        children: [
          _jsx("h2", {
            className: "text-lg font-semibold border-b border-border pb-2 mb-4",
            children: "Latency",
          }),
          _jsxs("div", {
            className: "grid grid-cols-1 lg:grid-cols-2 gap-6",
            children: [
              _jsx(ModelDetailLatencyChart, {
                data: latencyTrend,
                loading: loading,
                rangeLabel: rangeLabel,
              }),
              _jsx(ModelDetailTTFTChart, { data: ttft, loading: loading }),
            ],
          }),
        ],
      }),
      _jsx(Separator, {}),
      _jsxs("section", {
        children: [
          _jsx("h2", {
            className: "text-lg font-semibold border-b border-border pb-2 mb-4",
            children: "Reliability",
          }),
          _jsxs("div", {
            className: "grid grid-cols-1 lg:grid-cols-3 gap-6",
            children: [
              _jsx(ModelDetailErrorBreakdown, {
                data: errorBreakdown,
                loading: loading,
                rangeLabel: rangeLabel,
              }),
              _jsx(ModelDetailErrorTrendChart, {
                data: dailyErrorTrend,
                loading: loading,
                rangeLabel: rangeLabel,
              }),
              _jsx(ModelDetailStatusChart, {
                data: statusDistribution,
                loading: loading,
              }),
            ],
          }),
        ],
      }),
      _jsx(Separator, {}),
      _jsxs("section", {
        children: [
          _jsx("h2", {
            className: "text-lg font-semibold border-b border-border pb-2 mb-4",
            children: "Usage Patterns",
          }),
          _jsxs("div", {
            className: "grid grid-cols-1 lg:grid-cols-2 gap-6",
            children: [
              _jsx(ModelDetailHourlyChart, {
                data: hourlyUsage,
                loading: loading,
                rangeLabel: rangeLabel,
              }),
              _jsx(ModelDetailTrendChart, {
                data: dailySpendTrend,
                loading: loading,
                rangeLabel: rangeLabel,
              }),
            ],
          }),
        ],
      }),
      _jsx(Separator, {}),
      _jsxs("section", {
        children: [
          _jsx("h2", {
            className: "text-lg font-semibold border-b border-border pb-2 mb-4",
            children: "Provider Breakdown",
          }),
          _jsx(ModelDetailProviderChart, {
            data: providerBreakdown,
            loading: loading,
          }),
        ],
      }),
      _jsx(Separator, {}),
      _jsxs("section", {
        children: [
          _jsx("h2", {
            className: "text-lg font-semibold border-b border-border pb-2 mb-4",
            children: "Top Entities",
          }),
          _jsxs("div", {
            className: "grid grid-cols-1 lg:grid-cols-2 gap-6",
            children: [
              _jsx(ModelDetailUserTable, {
                users: topUsers,
                loading: loading,
                rangeLabel: rangeLabel,
              }),
              _jsx(ModelDetailApiKeyTable, {
                apiKeys: topApiKeys,
                loading: loading,
                rangeLabel: rangeLabel,
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
export default ModelDetailPage;
