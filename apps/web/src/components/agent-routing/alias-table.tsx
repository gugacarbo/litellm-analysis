import { Pencil, Trash2 } from "lucide-react";
import { Button } from "../button";
import type { AliasEntry } from "../pages/models/models-alias-utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../table";

type AliasTableProps = {
  aliases: AliasEntry[];
  onEdit?: (alias: string, value: string) => void;
  onDelete?: (alias: string) => void;
  saving?: boolean;
};

export function AliasTable({
  aliases,
  onEdit,
  onDelete,
  saving = false,
}: AliasTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Alias</TableHead>
          <TableHead>Routes To</TableHead>
          <TableHead className="w-25">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {aliases.map((alias) => (
          <TableRow key={alias.key}>
            <TableCell className="font-mono font-medium">{alias.key}</TableCell>
            <TableCell className="font-mono">{alias.value}</TableCell>
            <TableCell>
              <div className="flex items-center justify-end gap-1">
                {onEdit && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onEdit(alias.key, alias.value)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onDelete(alias.key)}
                    disabled={saving}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
