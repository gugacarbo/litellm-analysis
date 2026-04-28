import { Skeleton } from "../skeleton";
import { TableCell, TableRow } from "../table";
import type { TableColumn } from "./logs-table-columns";

type LogsTableSkeletonProps = {
  showGroupExpanderColumn: boolean;
  tableColumns: TableColumn[];
};

export function LogsTableSkeleton({
  showGroupExpanderColumn,
  tableColumns,
}: LogsTableSkeletonProps) {
  return Array.from({ length: 10 }).map((_, rowIndex) => (
    <TableRow key={rowIndex}>
      {showGroupExpanderColumn ? (
        <TableCell className="w-10">
          <Skeleton className="h-4 w-4" />
        </TableCell>
      ) : null}
      {tableColumns.map((column) => (
        <TableCell
          key={`${rowIndex}-${column.key}`}
          className={column.align === "right" ? "text-right" : ""}
        >
          <Skeleton
            className={
              column.align === "right" ? "h-4 w-14 ml-auto" : "h-4 w-24"
            }
          />
        </TableCell>
      ))}
    </TableRow>
  ));
}
