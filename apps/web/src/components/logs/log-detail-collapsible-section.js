import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
export function CollapsibleSection({
  title,
  icon: Icon,
  defaultOpen = false,
  children,
  className = "",
  contentClassName = "",
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return _jsxs("div", {
    className: `rounded-lg border overflow-hidden ${className}`,
    children: [
      _jsxs("button", {
        type: "button",
        onClick: () => setIsOpen((prev) => !prev),
        className:
          "flex w-full cursor-pointer items-center gap-2 px-3 py-2 bg-muted/30 hover:bg-muted/50 transition-colors duration-150",
        children: [
          Icon &&
            _jsx(Icon, {
              className: "h-3.5 w-3.5 shrink-0 text-muted-foreground",
            }),
          _jsx("span", {
            className:
              "flex-1 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground",
            children: title,
          }),
          _jsx("span", {
            className: `transition-transform duration-200 ease-in-out ${isOpen ? "rotate-0" : "-rotate-90"}`,
            children: isOpen
              ? _jsx(ChevronDown, {
                  className: "h-4 w-4 text-muted-foreground",
                })
              : _jsx(ChevronRight, {
                  className: "h-4 w-4 text-muted-foreground",
                }),
          }),
        ],
      }),
      _jsx("div", {
        className: `transition-all duration-300 ease-in-out ${isOpen ? "max-h-[2000px]" : "max-h-0"} overflow-hidden`,
        children: _jsx("div", {
          className: `p-4 ${contentClassName}`,
          children: children,
        }),
      }),
    ],
  });
}
