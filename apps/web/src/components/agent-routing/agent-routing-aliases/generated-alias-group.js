import { ChevronDown, ChevronRight, Pencil, Trash2 } from "lucide-react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "../../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
export function GeneratedAliasGroup({
  group,
  isExpanded,
  onToggle,
  expandedSubgroups,
  onToggleSubgroup,
  saving,
  onOpenEditAlias,
  onDeleteAlias,
}) {
  if (!(group.subgroups?.length ?? 0)) return null;
  return _jsxs("div", {
    className: "border rounded-lg",
    children: [
      _jsxs("button", {
        type: "button",
        onClick: onToggle,
        className:
          "flex items-center gap-2 w-full px-3 py-2 hover:bg-muted/50 transition-colors",
        children: [
          isExpanded
            ? _jsx(ChevronDown, { className: "h-4 w-4 text-muted-foreground" })
            : _jsx(ChevronRight, {
                className: "h-4 w-4 text-muted-foreground",
              }),
          _jsx("span", { className: "font-medium", children: group.name }),
          _jsxs("span", {
            className: "text-xs text-muted-foreground ml-auto",
            children: [
              group.subgroups?.length ?? 0,
              " group",
              (group.subgroups?.length ?? 0) !== 1 ? "s" : "",
            ],
          }),
        ],
      }),
      isExpanded &&
        _jsx("div", {
          className: "pl-4 pb-2",
          children: group.subgroups?.map((subgroup) => {
            const isSubExpanded = expandedSubgroups.has(subgroup.key);
            return _jsxs(
              "div",
              {
                className: "mt-2",
                children: [
                  _jsxs("button", {
                    type: "button",
                    onClick: () => onToggleSubgroup(subgroup.key),
                    className:
                      "flex items-center gap-2 w-full px-3 py-1.5 hover:bg-muted/50 transition-colors rounded-md",
                    children: [
                      isSubExpanded
                        ? _jsx(ChevronDown, {
                            className: "h-3 w-3 text-muted-foreground",
                          })
                        : _jsx(ChevronRight, {
                            className: "h-3 w-3 text-muted-foreground",
                          }),
                      _jsx("span", {
                        className: "text-sm font-medium",
                        children: subgroup.name,
                      }),
                      _jsx("span", {
                        className: "text-xs text-muted-foreground ml-auto",
                        children: subgroup.aliases.length,
                      }),
                    ],
                  }),
                  isSubExpanded &&
                    _jsxs(Table, {
                      className: "mt-1",
                      children: [
                        _jsx(TableHeader, {
                          children: _jsxs(TableRow, {
                            children: [
                              _jsx(TableHead, { children: "Alias" }),
                              _jsx(TableHead, { children: "Routes To" }),
                              _jsx(TableHead, {
                                className: "w-25",
                                children: "Actions",
                              }),
                            ],
                          }),
                        }),
                        _jsx(TableBody, {
                          children: subgroup.aliases.map((alias) =>
                            _jsxs(
                              TableRow,
                              {
                                children: [
                                  _jsx(TableCell, {
                                    className: "font-mono font-medium",
                                    children: alias.key,
                                  }),
                                  _jsx(TableCell, {
                                    className: "font-mono",
                                    children: alias.value,
                                  }),
                                  _jsx(TableCell, {
                                    children: _jsxs("div", {
                                      className:
                                        "flex items-center justify-end gap-1",
                                      children: [
                                        _jsx(Button, {
                                          variant: "ghost",
                                          size: "icon-sm",
                                          onClick: () =>
                                            onOpenEditAlias(
                                              alias.key,
                                              alias.value,
                                            ),
                                          children: _jsx(Pencil, {
                                            className: "h-4 w-4",
                                          }),
                                        }),
                                        _jsx(Button, {
                                          variant: "ghost",
                                          size: "icon-sm",
                                          onClick: () =>
                                            onDeleteAlias(alias.key),
                                          disabled: saving,
                                          children: _jsx(Trash2, {
                                            className: "h-4 w-4",
                                          }),
                                        }),
                                      ],
                                    }),
                                  }),
                                ],
                              },
                              alias.key,
                            ),
                          ),
                        }),
                      ],
                    }),
                ],
              },
              subgroup.key,
            );
          }),
        }),
    ],
  });
}
