import { Database, Pencil, Plus, Trash2 } from "lucide-react";
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
  customAliases: Array<[string, string]>;
  onOpenAddAlias: () => void;
  onOpenEditAlias: (key: string, value: string) => void;
  onDeleteAlias: (key: string) => void;
};

export function AgentRoutingAliasesTab({
  loading,
  saving,
  error = null,
  customAliases,
  onOpenAddAlias,
  onOpenEditAlias,
  onDeleteAlias,
}: AgentRoutingAliasesTabProps) {
  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Custom Aliases
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
          ) : customAliases.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No custom aliases configured. Add one to route additional model
              names.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Alias</TableHead>
                  <TableHead>Routes To</TableHead>
                  <TableHead className="w-25">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customAliases.map(([key, value]) => (
                  <TableRow key={key}>
                    <TableCell className="font-mono font-medium">
                      {key}
                    </TableCell>
                    <TableCell className="font-mono">{value}</TableCell>
                    <TableCell>
                      <FeatureGate capability="agentRouting">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => onOpenEditAlias(key, value)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => onDeleteAlias(key)}
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
        </CardContent>
      </Card>
    </div>
  );
}
