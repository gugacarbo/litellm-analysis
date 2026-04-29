import { Pencil, Trash2 } from "lucide-react";
import type { AliasEntry } from "../../pages/models/models-alias-utils";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

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
  saving,
}: AliasTableProps) {
  if (aliases.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center text-sm">
        Nenhum alias configurado
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Alias</TableHead>
            <TableHead>Model</TableHead>
            <TableHead className="w-[100px]">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {aliases.map((entry) => (
            <TableRow key={entry.key}>
              <TableCell className="font-mono text-sm">{entry.key}</TableCell>
              <TableCell className="font-mono text-sm">{entry.value}</TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(entry.key, entry.value)}
                      disabled={saving}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(entry.key)}
                      disabled={saving}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
