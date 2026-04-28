import { ChevronDown, ChevronRight, Pencil, Trash2 } from "lucide-react";
import type { AliasGroup } from "../../../pages/models/models-alias-utils";
import { Button } from "../../button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../table";

type CustomAliasGroupProps = {
  group: AliasGroup;
  isExpanded: boolean;
  onToggle: () => void;
  saving: boolean;
  onOpenEditAlias: (key: string, value: string) => void;
  onDeleteAlias: (key: string) => void;
};

export function CustomAliasGroup({
  group,
  isExpanded,
  onToggle,
  saving,
  onOpenEditAlias,
  onDeleteAlias,
}: CustomAliasGroupProps) {
  if (!group.aliases?.length) return null;

  return (
    <div className="border rounded-lg">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 w-full px-3 py-2 hover:bg-muted/50 transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
        <span className="font-medium">{group.name}</span>
        <span className="text-xs text-muted-foreground ml-auto">
          {group.aliases?.length ?? 0} alias
          {(group.aliases?.length ?? 0) !== 1 ? "es" : ""}
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
            {group.aliases?.map((alias) => (
              <TableRow key={alias.key}>
                <TableCell className="font-mono font-medium">
                  {alias.key}
                </TableCell>
                <TableCell className="font-mono">{alias.value}</TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onOpenEditAlias(alias.key, alias.value)}
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
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
