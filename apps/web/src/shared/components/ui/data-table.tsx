import type {
  ColumnDef,
  ColumnFiltersState,
  OnChangeFn,
  PaginationState,
  RowSelectionState,
  SortingState,
  VisibilityState,
} from "@tanstack/react-table";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import * as React from "react";
import { cn } from "@/shared/lib/utils";
import { Button } from "./button";

import { Skeleton } from "./skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DataTableSortStatus = {
  sortField: string | null;
  sortDirection: "asc" | "desc";
};

export type DataTableProps<TData, TValue> = {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];

  /** Loading state — renders skeleton rows */
  loading?: boolean;
  /** Number of skeleton rows when loading (default 10) */
  loadingSkeletonRows?: number;
  /** Message shown when data is empty (default "No results.") */
  emptyMessage?: string;

  // -- Column visibility ----------------------------------------------------
  /** External column visibility (controlled) */
  columnVisibility?: VisibilityState;
  /** External column visibility change handler */
  onColumnVisibilityChange?: OnChangeFn<VisibilityState>;

  // -- Client-side filtering (filter input) ---------------------------------
  /** Which column to filter by (accessorKey) */
  filterColumn?: string;
  /** Placeholder text for the filter input */
  filterPlaceholder?: string;
  /** Show the filter input */
  showFilterInput?: boolean;

  // -- Client-side sorting (controlled) -------------------------------------
  /** External sort state for manual/remote sorting */
  sortStatus?: DataTableSortStatus;
  /** Callback when a sortable header is clicked (for remote sorting) */
  onSortChange?: (field: string) => void;

  // -- Pagination -----------------------------------------------------------
  /** Enable pagination controls (default true) */
  showPagination?: boolean;
  /** Page size for client-side pagination (default 20) */
  pageSize?: number;
  /** Page size options for the selector */
  pageSizeOptions?: number[];

  // -- Server-side pagination override --------------------------------------
  /** Use server-side pagination instead of client-side */
  manualPagination?: boolean;
  /** Total pages for server-side pagination */
  pageCount?: number;
  /** Current page index (0-based) for server-side pagination */
  pageIndex?: number;
  /** Callback when page/pageSize changes */
  onPaginationChange?: OnChangeFn<PaginationState>;

  // -- Selection ------------------------------------------------------------
  rowSelection?: RowSelectionState;
  onRowSelectionChange?: OnChangeFn<RowSelectionState>;

  // -- Custom header / toolbar content --------------------------------------
  toolbar?: React.ReactNode;

  /** Custom display labels for columns in the visibility dropdown */
  columnLabels?: Record<string, string>;

  // -- Cell alignment helpers -----------------------------------------------
  /** Align a column by its accessorKey */
  align?: Record<string, "left" | "right" | "center">;

  // -- Row click ------------------------------------------------------------
  onRowClick?: (row: TData) => void;

  // -- Styling --------------------------------------------------------------
  className?: string;
  showColumnsSelector?: boolean;
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function DataTable<TData, TValue>({
  columns,
  data,
  loading = false,
  loadingSkeletonRows = 10,
  emptyMessage = "No results.",
  columnVisibility: externalColumnVisibility,
  onColumnVisibilityChange,
  filterColumn,
  showFilterInput = true,
  sortStatus,
  onSortChange,
  showPagination = true,
  pageSize = 20,
  pageSizeOptions = [10, 20, 50, 100],
  manualPagination = false,
  pageCount,
  pageIndex: externalPageIndex,
  onPaginationChange,
  rowSelection,
  onRowSelectionChange,
  toolbar,
  align,
  onRowClick,
  className,
}: DataTableProps<TData, TValue>) {
  // -- Internal state (used when not controlled) --
  const [internalSorting, setInternalSorting] = React.useState<SortingState>(
    [],
  );
  const [internalColumnFilters, setInternalColumnFilters] =
    React.useState<ColumnFiltersState>([]);
  const [internalColumnVisibility, setInternalColumnVisibility] =
    React.useState<VisibilityState>({});
  const [internalRowSelection, setInternalRowSelection] =
    React.useState<RowSelectionState>({});
  const [internalPagination, setInternalPagination] =
    React.useState<PaginationState>({
      pageIndex: 0,
      pageSize,
    });

  const isControlledVisibility =
    externalColumnVisibility !== undefined &&
    onColumnVisibilityChange !== undefined;

  // Server-side sort → map to tanstack sort
  const sorting: SortingState = sortStatus?.sortField
    ? [
        {
          id: sortStatus.sortField,
          desc: sortStatus.sortDirection === "desc",
        },
      ]
    : internalSorting;

  const setSorting: OnChangeFn<SortingState> = (updaterOrValue) => {
    if (onSortChange) {
      // Manual (server-side) sorting
      const newValue =
        typeof updaterOrValue === "function"
          ? updaterOrValue(sorting)
          : updaterOrValue;
      if (newValue.length > 0) {
        onSortChange(newValue[0]?.id ?? "");
      } else {
        onSortChange("");
      }
    } else {
      setInternalSorting(
        typeof updaterOrValue === "function"
          ? updaterOrValue(internalSorting)
          : updaterOrValue,
      );
    }
  };

  const computedPageCount =
    manualPagination && pageCount !== undefined ? pageCount : undefined;

  const pagination =
    manualPagination && externalPageIndex !== undefined
      ? { pageIndex: externalPageIndex, pageSize }
      : internalPagination;

  const setPagination: OnChangeFn<PaginationState> = (updaterOrValue) => {
    if (onPaginationChange) {
      onPaginationChange(updaterOrValue);
    } else {
      setInternalPagination(
        typeof updaterOrValue === "function"
          ? updaterOrValue(internalPagination)
          : updaterOrValue,
      );
    }
  };

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnFilters: internalColumnFilters,
      columnVisibility: isControlledVisibility
        ? externalColumnVisibility
        : internalColumnVisibility,
      rowSelection: rowSelection ?? internalRowSelection,
      pagination,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setInternalColumnFilters,
    onColumnVisibilityChange: isControlledVisibility
      ? onColumnVisibilityChange
      : setInternalColumnVisibility,
    onRowSelectionChange: onRowSelectionChange ?? setInternalRowSelection,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: onSortChange ? undefined : getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: manualPagination
      ? undefined
      : getPaginationRowModel(),
    manualPagination,
    pageCount: computedPageCount,
  });

  // -- Render ---------------------------------------------------------------

  showFilterInput && filterColumn
    ? true
    : toolbar
      ? true
      : columns.some((c) => c.enableHiding !== false);

  return (
    <div className={cn("w-full", className)}>
      {/* Toolbar */}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const colId = header.column.id;
                  const colAlign = align?.[colId];
                  return (
                    <TableHead
                      key={header.id}
                      className={cn(
                        colAlign === "right" && "text-right",
                        colAlign === "center" && "text-center",
                        header.column.getCanSort() &&
                          "cursor-pointer select-none",
                      )}
                      onClick={
                        header.column.getCanSort()
                          ? header.column.getToggleSortingHandler()
                          : undefined
                      }
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: loadingSkeletonRows }).map((_, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map((_col, colIndex) => (
                    <TableCell key={colIndex}>
                      <Skeleton className="h-4 w-[80%]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={
                    onRowClick ? () => onRowClick(row.original) : undefined
                  }
                  className={cn(onRowClick && "cursor-pointer")}
                >
                  {row.getVisibleCells().map((cell) => {
                    const colAlign = align?.[cell.column.id];
                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          colAlign === "right" && "text-right",
                          colAlign === "center" && "text-center",
                        )}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {showPagination && table.getPageCount() > 0 && (
        <div className="flex items-center justify-between py-4 gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {table.getFilteredSelectedRowModel().rows.length > 0 && (
              <span>
                {table.getFilteredSelectedRowModel().rows.length} of{" "}
                {table.getFilteredRowModel().rows.length} row(s) selected.
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 ms-auto">
            <span className="text-sm text-muted-foreground">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>

            {!manualPagination && (
              <select
                className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
                value={table.getState().pagination.pageSize}
                onChange={(e) => {
                  table.setPageSize(Number(e.target.value));
                }}
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}/page
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
