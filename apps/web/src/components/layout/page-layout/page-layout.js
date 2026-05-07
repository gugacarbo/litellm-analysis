import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { PageLayoutHeader } from "./page-layout-header";
export function PageLayout({
  title,
  subtitle,
  icon: Icon,
  showFilters = true,
  filters,
  buttons,
  onReload,
  variant = "default",
  children,
}) {
  return _jsxs("div", {
    className: `p-2 md:pr-3 ${variant === "flex" ? "flex flex-col" : ""} `,
    children: [
      _jsx(PageLayoutHeader, {
        title: title,
        subtitle: subtitle,
        icon: Icon,
        showFilters: showFilters,
        filters: filters,
        buttons: buttons,
        onReload: onReload,
      }),
      children,
    ],
  });
}
