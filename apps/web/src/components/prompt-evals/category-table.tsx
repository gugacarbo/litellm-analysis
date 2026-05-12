import { cn } from "../../lib/utils";
import type { CategoryMetrics } from "../../pages/prompt-evals/types";
import { formatPrecision, getScoreColor } from "../../pages/prompt-evals/utils";

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
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            <th className="px-3 py-2 text-left font-medium">Categoria</th>
            <th className="px-3 py-2 text-right font-medium">P</th>
            <th className="px-3 py-2 text-right font-medium">R</th>
            <th className="px-3 py-2 text-right font-medium">F1</th>
            <th className="px-3 py-2 text-right font-medium">Casos</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => {
            const passed = cat.f1 !== null && cat.f1 >= threshold;
            return (
              <tr
                key={cat.category}
                className="border-b last:border-b-0 hover:bg-muted/30"
              >
                <td className="px-3 py-2">
                  <span
                    className={cn(
                      "mr-2",
                      passed ? "text-green-500" : "text-red-500",
                    )}
                  >
                    {passed ? "●" : "○"}
                  </span>
                  <span className="font-mono">{cat.category}</span>
                </td>
                <td className="px-3 py-2 text-right font-mono">
                  {formatPrecision(cat.precision, 2)}
                </td>
                <td className="px-3 py-2 text-right font-mono">
                  {formatPrecision(cat.recall, 2)}
                </td>
                <td
                  className={cn(
                    "px-3 py-2 text-right font-mono font-medium",
                    getScoreColor(cat.f1),
                  )}
                >
                  {formatPrecision(cat.f1, 2)}
                </td>
                <td className="px-3 py-2 text-right">
                  <span
                    className={cn(
                      cat.matchedCases === cat.totalCases
                        ? "text-green-500"
                        : "text-red-500",
                    )}
                  >
                    {cat.matchedCases}/{cat.totalCases}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
