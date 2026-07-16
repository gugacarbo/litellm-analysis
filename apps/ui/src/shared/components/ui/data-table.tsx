"use client";

import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  type SortingState,
  type TableOptions,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { cn } from "@/shared/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

type DataTableProps<TData, TValue> = Readonly<{
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  emptyMessage?: string;
  getRowId?: TableOptions<TData>["getRowId"];
  className?: string;
}>;

/**
 * Standard tabular foundation for the app. Feature tables provide their own
 * columns and controls, while this component owns the TanStack Table rendering.
 */
function DataTable<TData, TValue>({
  columns,
  data,
  emptyMessage = "No results.",
  getRowId,
  className,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId,
    onSortingChange: setSorting,
    state: { sorting },
  });

  return (
    <div className={cn("rounded-md border bg-card", className)}>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : header.column.getCanSort()
                      ? (() => {
                          const SortIcon =
                            header.column.getIsSorted() === "asc"
                              ? ArrowUp
                              : header.column.getIsSorted() === "desc"
                                ? ArrowDown
                                : ChevronsUpDown;
                          return (
                            <button
                              className="inline-flex items-center gap-1 hover:text-foreground"
                              onClick={header.column.getToggleSortingHandler()}
                              type="button"
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext(),
                              )}
                              <SortIcon
                                aria-hidden="true"
                                className="size-3.5 text-muted-foreground"
                              />
                            </button>
                          );
                        })()
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell className="h-24 text-center" colSpan={columns.length}>
                {emptyMessage}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

export { DataTable };
