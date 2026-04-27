import {
  ChevronDown,
  ChevronRight,
  Database,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import type { AliasGroup } from "../../pages/models/models-alias-utils";
import { Button } from "../button";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import { FeatureGate } from "../feature-gate";
import { Skeleton } from "../skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../table";

type AgentRoutingAliasesTabProps = {
  loading: boolean;
  saving: boolean;
  error?: string | null;
  aliasGroups: AliasGroup[];
  onOpenAddAlias: () => void;
  onOpenEditAlias: (key: string, value: string) => void;
  onDeleteAlias: (key: string) => void;
};

export function AgentRoutingAliasesTab({
  loading,
  saving,
  error = null,
  aliasGroups,
  onOpenAddAlias,
  onOpenEditAlias,
  onDeleteAlias,
}: AgentRoutingAliasesTabProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedSubgroups, setExpandedSubgroups] = useState<Set<string>>(
    new Set(),
  );

  function toggleGroup(key: string) {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleSubgroup(key: string) {
    setExpandedSubgroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const hasAnyAliases = aliasGroups.some((g) =>
    g.type === "custom" ? g.aliases.length > 0 : g.subgroups.length > 0,
  );

  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Aliases
          </CardTitle>
          <FeatureGate capability="agentRouting">
            <Button onClick={onOpenAddAlias} size="sm">
              <Plus className="h-4 w-4" />
              Add Alias
            </Button>
          </FeatureGate>
        </CardHeader>

        <CardContent>
          {error && <div className="p-4 text-destructive">Error: {error}</div>}

          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : !hasAnyAliases ? (
            <div className="text-center text-muted-foreground py-8">
              No aliases configured. Add one to route model names.
            </div>
          ) : (
            <div className="space-y-3">
              {aliasGroups.map((group) => {
                const isExpanded = expandedGroups.has(group.key);

                if (group.type === "custom") {
                  if (!group.aliases.length) return null;
                  return (
                    <div key={group.key} className="border rounded-lg">
                      <button
                        type="button"
                        onClick={() => toggleGroup(group.key)}
                        className="flex items-center gap-2 w-full px-3 py-2 hover:bg-muted/50 transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className="font-medium">{group.name}</span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {group.aliases.length} alias
                          {group.aliases.length !== 1 ? "es" : ""}
                        </span>
                      </button>

                      {isExpanded && (
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Alias</TableHead>
                              <TableHead>Routes To</TableHead>
                              <TableHead className="w-25">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {group.aliases.map((alias) => (
                              <TableRow key={alias.key}>
                                <TableCell className="font-mono font-medium">
                                  {alias.key}
                                </TableCell>
                                <TableCell className="font-mono">
                                  {alias.value}
                                </TableCell>
                                <TableCell>
                                  <FeatureGate capability="agentRouting">
                                    <div className="flex items-center justify-end gap-1">
                                      <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        onClick={() =>
                                          onOpenEditAlias(
                                            alias.key,
                                            alias.value,
                                          )
                                        }
                                      >
                                        <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon-sm"
                                        onClick={() => onDeleteAlias(alias.key)}
                                        disabled={saving}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  </FeatureGate>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                  );
                }

                if (!group.subgroups.length) return null;

                return (
                  <div key={group.key} className="border rounded-lg">
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.key)}
                      className="flex items-center gap-2 w-full px-3 py-2 hover:bg-muted/50 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span className="font-medium">{group.name}</span>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {group.subgroups.length} group
                        {group.subgroups.length !== 1 ? "s" : ""}
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="pl-4 pb-2">
                        {group.subgroups.map((subgroup) => {
                          const isSubExpanded = expandedSubgroups.has(
                            subgroup.key,
                          );
                          return (
                            <div key={subgroup.key} className="mt-2">
                              <button
                                type="button"
                                onClick={() => toggleSubgroup(subgroup.key)}
                                className="flex items-center gap-2 w-full px-3 py-1.5 hover:bg-muted/50 transition-colors rounded-md"
                              >
                                {isSubExpanded ? (
                                  <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                )}
                                <span className="text-sm font-medium">
                                  {subgroup.name}
                                </span>
                                <span className="text-xs text-muted-foreground ml-auto">
                                  {subgroup.aliases.length}
                                </span>
                              </button>

                              {isSubExpanded && (
                                <Table className="mt-1">
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Alias</TableHead>
                                      <TableHead>Routes To</TableHead>
                                      <TableHead className="w-25">
                                        Actions
                                      </TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {subgroup.aliases.map((alias) => (
                                      <TableRow key={alias.key}>
                                        <TableCell className="font-mono font-medium">
                                          {alias.key}
                                        </TableCell>
                                        <TableCell className="font-mono">
                                          {alias.value}
                                        </TableCell>
                                        <TableCell>
                                          <FeatureGate capability="agentRouting">
                                            <div className="flex items-center justify-end gap-1">
                                              <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                onClick={() =>
                                                  onOpenEditAlias(
                                                    alias.key,
                                                    alias.value,
                                                  )
                                                }
                                              >
                                                <Pencil className="h-4 w-4" />
                                              </Button>
                                              <Button
                                                variant="ghost"
                                                size="icon-sm"
                                                onClick={() =>
                                                  onDeleteAlias(alias.key)
                                                }
                                                disabled={saving}
                                              >
                                                <Trash2 className="h-4 w-4" />
                                              </Button>
                                            </div>
                                          </FeatureGate>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
