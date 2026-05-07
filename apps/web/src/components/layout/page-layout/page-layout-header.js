import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { DateRangeFilter } from "../../ui/date-range-filter";
import { ReloadButton } from "../../ui/reload-button";

function PageLayoutHeader({
  title,
  subtitle,
  icon: Icon,
  showFilters,
  filters,
  buttons,
  onReload,
}) {
  const filterContent = showFilters
    ? (filters ?? _jsx(DateRangeFilter, {}))
    : null;
  const hasRightContent = filterContent || buttons || onReload;
  return _jsxs("div", {
    className: "flex items-start justify-between gap-4 flex-wrap py-4",
    children: [
      _jsxs("div", {
        className: "flex-1 min-w-0 gap-2",
        children: [
          _jsxs("h1", {
            className: "text-2xl font-bold flex items-center gap-2 ",
            children: [Icon && _jsx(Icon, { className: "h-8 w-8" }), title],
          }),
          subtitle &&
            _jsx("p", {
              className: "text-muted-foreground text-sm",
              children: subtitle,
            }),
        ],
      }),
      hasRightContent &&
        _jsxs("div", {
          className: "flex flex-col items-end gap-2 h-full justify-between",
          children: [
            filterContent,
            _jsxs("div", {
              className: "flex items-center gap-2",
              children: [
                buttons,
                onReload && _jsx(ReloadButton, { onClick: onReload }),
              ],
            }),
          ],
        }),
    ],
  });
}

export { PageLayoutHeader };
