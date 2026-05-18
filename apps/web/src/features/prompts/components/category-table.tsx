import type { CategoryMetrics } from "types";
import { formatPrecision, getScoreColor } from "utils";
import { cn } from "@/shared/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";

interface CategoryTableProps {
  categories: CategoryMetrics[];
  threshold?: number;
}

export function CategoryTable({
  categories,
  threshold = 0.8,
}: CategoryTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Categoria</TableHead>
            <TableHead className="text-right">P</TableHead>
            <TableHead className="text-right">R</TableHead>
            <TableHead className="text-right">F1</TableHead>
            <TableHead className="text-right">Casos</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((cat) => {
            const passed = cat.f1 !== null && cat.f1 >= threshold;
            return (
              <TableRow key={cat.category}>
                <TableCell>
                  <span
                    className={cn(
                      "mr-2",
                      passed ? "text-green-500" : "text-red-500",
                    )}
                  >
                    {passed ? "●" : "○"}
                  </span>
                  <span className="font-mono">{cat.category}</span>
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatPrecision(cat.precision, 2)}
                </TableCell>
                <TableCell className="text-right font-mono">
                  {formatPrecision(cat.recall, 2)}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-mono font-medium",
                    getScoreColor(cat.f1),
                  )}
                >
                  {formatPrecision(cat.f1, 2)}
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className={cn(
                      cat.matchedCases === cat.totalCases
                        ? "text-green-500"
                        : "text-red-500",
                    )}
                  >
                    {cat.matchedCases}/{cat.totalCases}
                  </span>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
