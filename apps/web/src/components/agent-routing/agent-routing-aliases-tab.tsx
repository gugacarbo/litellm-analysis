import { Database, Plus } from "lucide-react";
import { useState } from "react";
import type { AliasGroup } from "../../pages/models/models-alias-utils";
import { Button } from "../button";
import { Card, CardContent, CardHeader, CardTitle } from "../card";
import { Skeleton } from "../skeleton";
import { CustomAliasGroup } from "./agent-routing-aliases/custom-alias-group";
import { GeneratedAliasGroup } from "./agent-routing-aliases/generated-alias-group";

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

  const hasAnyAliases = aliasGroups.some((g) => {
    if (g.type === "custom") {
      return (g.aliases?.length ?? 0) > 0;
    }
    return (g.subgroups?.length ?? 0) > 0;
  });

  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Aliases
          </CardTitle>
          <Button onClick={onOpenAddAlias} size="sm">
            <Plus className="h-4 w-4" />
            Add Alias
          </Button>
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
                  return (
                    <CustomAliasGroup
                      key={group.key}
                      group={group}
                      isExpanded={isExpanded}
                      onToggle={() => toggleGroup(group.key)}
                      saving={saving}
                      onOpenEditAlias={onOpenEditAlias}
                      onDeleteAlias={onDeleteAlias}
                    />
                  );
                }

                return (
                  <GeneratedAliasGroup
                    key={group.key}
                    group={group}
                    isExpanded={isExpanded}
                    onToggle={() => toggleGroup(group.key)}
                    expandedSubgroups={expandedSubgroups}
                    onToggleSubgroup={toggleSubgroup}
                    saving={saving}
                    onOpenEditAlias={onOpenEditAlias}
                    onDeleteAlias={onDeleteAlias}
                  />
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
