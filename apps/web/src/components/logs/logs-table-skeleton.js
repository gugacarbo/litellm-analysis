import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Skeleton } from "../ui/skeleton";
import { TableCell, TableRow } from "../ui/table";
export function LogsTableSkeleton({ showGroupExpanderColumn, tableColumns }) {
  return Array.from({ length: 10 }).map((_, rowIndex) =>
    _jsxs(
      TableRow,
      {
        children: [
          showGroupExpanderColumn
            ? _jsx(TableCell, {
                className: "w-10",
                children: _jsx(Skeleton, { className: "h-4 w-4" }),
              })
            : null,
          tableColumns.map((column) =>
            _jsx(
              TableCell,
              {
                className: column.align === "right" ? "text-right" : "",
                children: _jsx(Skeleton, {
                  className:
                    column.align === "right" ? "h-4 w-14 ml-auto" : "h-4 w-24",
                }),
              },
              `${rowIndex}-${column.key}`,
            ),
          ),
        ],
      },
      rowIndex,
    ),
  );
}
