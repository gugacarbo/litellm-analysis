import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function PageLayout({
  title,
  subtitle,
  icon: Icon,
  showFilters = true,
  filters,
  buttons,
  variant = "default",
  children,
}) {
  const containerClass = variant === "flex" ? "flex flex-col gap-3" : "";
  const hasRightContent = (showFilters && filters) || buttons;
  return _jsxs("div", {
    className: `p-2 ${containerClass}`,
    children: [
      _jsxs("div", {
        className: "flex items-start justify-between gap-4 flex-wrap",
        children: [
          _jsxs("div", {
            className: "flex-1 min-w-0 p-2",
            children: [
              _jsxs("h1", {
                className: "text-2xl font-bold flex items-center gap-2 p-2",
                children: [Icon && _jsx(Icon, { className: "h-8 w-8" }), title],
              }),
              subtitle &&
                _jsx("p", {
                  className: "text-muted-foreground mt-1",
                  children: subtitle,
                }),
            ],
          }),
          hasRightContent &&
            _jsxs("div", {
              className: "flex flex-col items-end gap-2",
              children: [
                showFilters && filters && filters,
                buttons &&
                  _jsx("div", {
                    className: "flex items-center gap-2",
                    children: buttons,
                  }),
              ],
            }),
        ],
      }),
      children,
    ],
  });
}
