import { ChevronDown, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Fragment as _Fragment,
  jsx as _jsx,
  jsxs as _jsxs,
} from "react/jsx-runtime";

function JsonValue({ defaultOpen, indentLevel = 0, value }) {
  if (value === null) {
    return _jsx("span", {
      className: "text-muted-foreground italic",
      children: "null",
    });
  }
  if (value === undefined) {
    return _jsx("span", {
      className: "text-muted-foreground italic",
      children: "undefined",
    });
  }
  if (typeof value === "string") {
    return _jsxs("span", {
      className: "text-emerald-600 dark:text-emerald-400",
      children: ['"', value, '"'],
    });
  }
  if (typeof value === "number") {
    return _jsx("span", {
      className: "text-amber-600 dark:text-amber-400",
      children: value,
    });
  }
  if (typeof value === "boolean") {
    return _jsx("span", {
      className: "text-purple-600 dark:text-purple-400",
      children: String(value),
    });
  }
  if (Array.isArray(value)) {
    return _jsx(JsonArray, {
      defaultOpen: defaultOpen,
      indentLevel: indentLevel,
      value: value,
    });
  }
  if (typeof value === "object") {
    return _jsx(JsonObject, {
      defaultOpen: defaultOpen,
      indentLevel: indentLevel,
      value: value,
    });
  }
  return _jsxs("span", {
    className: "text-red-500",
    children: ['"', String(value), '"'],
  });
}
function JsonObject({ defaultOpen, indentLevel = 0, value }) {
  const [isOpen, setIsOpen] = useState(false);
  const keys = Object.keys(value);
  const isEmpty = keys.length === 0;
  useEffect(() => {
    setIsOpen(defaultOpen ?? false);
  }, [defaultOpen]);
  if (isEmpty) {
    return _jsx("span", { className: "text-muted-foreground", children: "{}" });
  }
  const indent = "  ".repeat(indentLevel);
  return _jsxs("span", {
    className: "inline",
    children: [
      _jsxs("button", {
        className:
          "inline-flex items-center gap-1 -ml-0.5 cursor-pointer rounded px-0.5 hover:bg-muted/50 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        onClick: () => setIsOpen(!isOpen),
        type: "button",
        children: [
          isOpen
            ? _jsx(ChevronDown, {
                className: "h-3 w-3 shrink-0 text-muted-foreground",
              })
            : _jsx(ChevronRight, {
                className: "h-3 w-3 shrink-0 text-muted-foreground",
              }),
          _jsx("span", { className: "text-muted-foreground", children: "{" }),
          !isOpen &&
            _jsxs("span", {
              className: "text-muted-foreground/60",
              children: [
                _jsx("span", {
                  className: "text-muted-foreground",
                  children: "}",
                }),
                _jsxs("span", {
                  className: "ml-1 text-xs",
                  children: [
                    "(",
                    keys.length,
                    " ",
                    keys.length === 1 ? "key" : "keys",
                    ")",
                  ],
                }),
              ],
            }),
        ],
      }),
      isOpen &&
        _jsxs(_Fragment, {
          children: [
            _jsx("br", {}),
            keys.map((key, index) =>
              _jsxs(
                "span",
                {
                  children: [
                    indent,
                    _jsxs("span", {
                      className: "text-blue-600 dark:text-blue-400",
                      children: ['"', key, '"'],
                    }),
                    _jsx("span", {
                      className: "text-muted-foreground",
                      children: ": ",
                    }),
                    _jsx(JsonValue, {
                      defaultOpen: defaultOpen,
                      indentLevel: indentLevel + 1,
                      value: value[key],
                    }),
                    index < keys.length - 1 &&
                      _jsx("span", {
                        className: "text-muted-foreground",
                        children: ",",
                      }),
                    _jsx("br", {}),
                  ],
                },
                key,
              ),
            ),
            indent,
            _jsx("span", { className: "text-muted-foreground", children: "}" }),
          ],
        }),
    ],
  });
}
function JsonArray({ defaultOpen, indentLevel = 0, value }) {
  const [isOpen, setIsOpen] = useState(false);
  const isEmpty = value.length === 0;
  useEffect(() => {
    setIsOpen(defaultOpen ?? false);
  }, [defaultOpen]);
  if (isEmpty) {
    return _jsx("span", { className: "text-muted-foreground", children: "[]" });
  }
  const indent = "  ".repeat(indentLevel);
  return _jsxs("span", {
    className: "inline",
    children: [
      _jsxs("button", {
        className:
          "inline-flex items-center gap-1 -ml-0.5 cursor-pointer rounded px-0.5 hover:bg-muted/50 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        onClick: () => setIsOpen(!isOpen),
        type: "button",
        children: [
          isOpen
            ? _jsx(ChevronDown, {
                className: "h-3 w-3 shrink-0 text-muted-foreground",
              })
            : _jsx(ChevronRight, {
                className: "h-3 w-3 shrink-0 text-muted-foreground",
              }),
          _jsx("span", { className: "text-muted-foreground", children: "[" }),
          !isOpen &&
            _jsxs("span", {
              className: "text-muted-foreground/60",
              children: [
                _jsx("span", {
                  className: "text-muted-foreground",
                  children: "]",
                }),
                _jsxs("span", {
                  className: "ml-1 text-xs",
                  children: [
                    "(",
                    value.length,
                    " ",
                    value.length === 1 ? "item" : "items",
                    ")",
                  ],
                }),
              ],
            }),
        ],
      }),
      isOpen &&
        _jsxs(_Fragment, {
          children: [
            _jsx("br", {}),
            value.map((item, index) =>
              _jsxs(
                "span",
                {
                  children: [
                    indent,
                    _jsx(JsonValue, {
                      defaultOpen: defaultOpen,
                      indentLevel: indentLevel + 1,
                      value: item,
                    }),
                    index < value.length - 1 &&
                      _jsx("span", {
                        className: "text-muted-foreground",
                        children: ",",
                      }),
                    _jsx("br", {}),
                  ],
                },
                index,
              ),
            ),
            indent,
            _jsx("span", { className: "text-muted-foreground", children: "]" }),
          ],
        }),
    ],
  });
}
export function JsonViewer({
  className = "",
  data,
  defaultOpen = false,
  maxHeight = "max-h-96",
}) {
  if (data === null || data === undefined) {
    return _jsx("div", {
      className: `rounded-md bg-muted/50 p-3 font-mono text-xs italic text-muted-foreground ${className}`,
      children: "No data available",
    });
  }
  return _jsx("div", {
    className: `rounded-md bg-muted/50 p-3 font-mono text-xs overflow-y-auto ${maxHeight} ${className}`,
    children: _jsx(JsonValue, { value: data, defaultOpen: defaultOpen }),
  });
}
