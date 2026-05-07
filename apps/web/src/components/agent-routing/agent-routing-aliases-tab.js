import { Database, Plus } from "lucide-react";
import { useState } from "react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import { CustomAliasGroup } from "./agent-routing-aliases/custom-alias-group";
import { GeneratedAliasGroup } from "./agent-routing-aliases/generated-alias-group";
export function AgentRoutingAliasesTab({
  loading,
  saving,
  error = null,
  aliasGroups,
  onOpenAddAlias,
  onOpenEditAlias,
  onDeleteAlias,
}) {
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  const [expandedSubgroups, setExpandedSubgroups] = useState(new Set());
  function toggleGroup(key) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }
  function toggleSubgroup(key) {
    setExpandedSubgroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }
  const hasAnyAliases = aliasGroups.some((g) => {
    if (g.type === "custom") {
      return (g.aliases?.length ?? 0) > 0;
    }
    return (g.subgroups?.length ?? 0) > 0;
  });
  return _jsx("div", {
    className: "space-y-4 mt-4",
    children: _jsxs(Card, {
      children: [
        _jsxs(CardHeader, {
          className: "flex flex-row items-center justify-between",
          children: [
            _jsxs(CardTitle, {
              className: "flex items-center gap-2",
              children: [_jsx(Database, { className: "h-5 w-5" }), "Aliases"],
            }),
            _jsxs(Button, {
              onClick: onOpenAddAlias,
              size: "sm",
              children: [_jsx(Plus, { className: "h-4 w-4" }), "Add Alias"],
            }),
          ],
        }),
        _jsxs(CardContent, {
          children: [
            error &&
              _jsxs("div", {
                className: "p-4 text-destructive",
                children: ["Error: ", error],
              }),
            loading
              ? _jsx("div", {
                  className: "space-y-2",
                  children: Array.from({ length: 3 }).map((_, i) =>
                    _jsx(Skeleton, { className: "h-12 w-full" }, i),
                  ),
                })
              : !hasAnyAliases
                ? _jsx("div", {
                    className: "text-center text-muted-foreground py-8",
                    children:
                      "No aliases configured. Add one to route model names.",
                  })
                : _jsx("div", {
                    className: "space-y-3",
                    children: aliasGroups.map((group) => {
                      const isExpanded = expandedGroups.has(group.key);
                      if (group.type === "custom") {
                        return _jsx(
                          CustomAliasGroup,
                          {
                            group: group,
                            isExpanded: isExpanded,
                            onToggle: () => toggleGroup(group.key),
                            saving: saving,
                            onOpenEditAlias: onOpenEditAlias,
                            onDeleteAlias: onDeleteAlias,
                          },
                          group.key,
                        );
                      }
                      return _jsx(
                        GeneratedAliasGroup,
                        {
                          group: group,
                          isExpanded: isExpanded,
                          onToggle: () => toggleGroup(group.key),
                          expandedSubgroups: expandedSubgroups,
                          onToggleSubgroup: toggleSubgroup,
                          saving: saving,
                          onOpenEditAlias: onOpenEditAlias,
                          onDeleteAlias: onDeleteAlias,
                        },
                        group.key,
                      );
                    }),
                  }),
          ],
        }),
      ],
    }),
  });
}
