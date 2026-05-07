import { AlertTriangle, DollarSign, Hash, Server } from "lucide-react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { APP_LOCALE } from "@/lib/locale";
import { MetricCard } from "../metric-card";
export function ErrorsSummaryCards({ loading, totals }) {
  return _jsxs("div", {
    className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4",
    children: [
      _jsx(MetricCard, {
        icon: AlertTriangle,
        title: "Total Errors",
        value: totals.total,
        description: `${totals.serverErrors} server, ${totals.clientErrors} client`,
        colorScheme: "red",
        variant: "gradient",
        loading: loading,
      }),
      _jsx(MetricCard, {
        icon: Server,
        title: "5xx Errors",
        value: totals.serverErrors,
        colorScheme: "red",
        variant: "gradient",
        loading: loading,
      }),
      _jsx(MetricCard, {
        icon: AlertTriangle,
        title: "4xx Errors",
        value: totals.clientErrors,
        colorScheme: "amber",
        variant: "gradient",
        loading: loading,
      }),
      _jsx(MetricCard, {
        icon: Hash,
        title: "Unique Models",
        value: totals.uniqueModels,
        colorScheme: "neutral",
        variant: "gradient",
        loading: loading,
      }),
      _jsx(MetricCard, {
        icon: DollarSign,
        title: "Cost of Failures",
        value: `$${totals.totalSpendOnErrors.toFixed(4)}`,
        description: "Spend on failed requests",
        colorScheme: "amber",
        variant: "gradient",
        loading: loading,
      }),
      _jsx(MetricCard, {
        icon: Hash,
        title: "Tokens Wasted",
        value: totals.totalTokensBeforeErrors.toLocaleString(APP_LOCALE),
        description: "Partial token usage before errors",
        colorScheme: "blue",
        variant: "gradient",
        loading: loading,
      }),
    ],
  });
}
