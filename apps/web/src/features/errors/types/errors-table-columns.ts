import type { ErrorLog } from "@lite-llm/contracts/analytics";
import type { ColumnDef } from "@tanstack/react-table";
import { renderErrorCell } from "../components/errors-table-cell";

export type ErrorColumnKey =
  | "time"
  | "status"
  | "type"
  | "model"
  | "user"
  | "apiKey"
  | "spendStatus"
  | "message"
  | "requestId"
  | "requestKwargs"
  | "partialTokens"
  | "partialSpend";

export type ErrorColumn = {
  key: ErrorColumnKey;
  label: string;
  align?: "right";
  defaultVisible?: boolean;
};

export type TableColumn =
  | ErrorColumn
  | {
      key: "actions";
      label: "";
      align?: "right";
    };

export const ERROR_COLUMNS: ErrorColumn[] = [
  { key: "time", label: "Time" },
  { key: "status", label: "Status" },
  { key: "type", label: "Type" },
  { key: "model", label: "Model" },
  { key: "user", label: "User" },
  { key: "apiKey", label: "API Key", defaultVisible: false },
  { key: "spendStatus", label: "Spend Status", defaultVisible: false },
  { key: "message", label: "Message" },
  { key: "requestId", label: "Request ID", defaultVisible: false },
  { key: "requestKwargs", label: "Has Params", defaultVisible: false },
  {
    key: "partialTokens",
    label: "Partial Tokens",
    align: "right" as const,
    defaultVisible: false,
  },
  {
    key: "partialSpend",
    label: "Partial Spend",
    align: "right" as const,
    defaultVisible: false,
  },
];

export const DEFAULT_VISIBLE_ERROR_COLUMNS: ErrorColumnKey[] =
  ERROR_COLUMNS.filter((column) => column.defaultVisible !== false).map(
    (column) => column.key,
  );


export function buildErrorTableColumns(
  onSelectError: (errorLog: ErrorLog) => void,
): ColumnDef<ErrorLog>[] {
  return [
    {
      id: "time",
      accessorKey: "timestamp",
      header: () => "Time",
      cell: ({ row }) =>
        renderErrorCell({
          errorLog: row.original,
          columnKey: "time",
          onSelectError,
        }),
      enableSorting: false,
      enableHiding: true,
    },
    {
      id: "status",
      accessorKey: "status_code",
      header: () => "Status",
      cell: ({ row }) =>
        renderErrorCell({
          errorLog: row.original,
          columnKey: "status",
          onSelectError,
        }),
      enableSorting: false,
      enableHiding: true,
    },
    {
      id: "type",
      accessorKey: "error_type",
      header: () => "Type",
      cell: ({ row }) =>
        renderErrorCell({
          errorLog: row.original,
          columnKey: "type",
          onSelectError,
        }),
      enableSorting: false,
      enableHiding: true,
    },
    {
      id: "model",
      accessorKey: "model",
      header: () => "Model",
      cell: ({ row }) =>
        renderErrorCell({
          errorLog: row.original,
          columnKey: "model",
          onSelectError,
        }),
      enableSorting: false,
      enableHiding: true,
    },
    {
      id: "user",
      accessorKey: "user",
      header: () => "User",
      cell: ({ row }) =>
        renderErrorCell({
          errorLog: row.original,
          columnKey: "user",
          onSelectError,
        }),
      enableSorting: false,
      enableHiding: true,
    },
    {
      id: "apiKey",
      accessorKey: "api_key",
      header: () => "API Key",
      cell: ({ row }) =>
        renderErrorCell({
          errorLog: row.original,
          columnKey: "apiKey",
          onSelectError,
        }),
      enableSorting: false,
      enableHiding: true,
    },
    {
      id: "spendStatus",
      accessorKey: "spend_status",
      header: () => "Spend Status",
      cell: ({ row }) =>
        renderErrorCell({
          errorLog: row.original,
          columnKey: "spendStatus",
          onSelectError,
        }),
      enableSorting: false,
      enableHiding: true,
    },
    {
      id: "message",
      accessorKey: "error_message",
      header: () => "Message",
      cell: ({ row }) =>
        renderErrorCell({
          errorLog: row.original,
          columnKey: "message",
          onSelectError,
        }),
      enableSorting: false,
      enableHiding: true,
    },
    {
      id: "requestId",
      accessorKey: "id",
      header: () => "Request ID",
      cell: ({ row }) =>
        renderErrorCell({
          errorLog: row.original,
          columnKey: "requestId",
          onSelectError,
        }),
      enableSorting: false,
      enableHiding: true,
    },
    {
      id: "requestKwargs",
      accessorKey: "request_kwargs",
      header: () => "Has Params",
      cell: ({ row }) =>
        renderErrorCell({
          errorLog: row.original,
          columnKey: "requestKwargs",
          onSelectError,
        }),
      enableSorting: false,
      enableHiding: true,
    },
    {
      id: "partialTokens",
      accessorKey: "total_tokens",
      header: () => "Partial Tokens",
      cell: ({ row }) =>
        renderErrorCell({
          errorLog: row.original,
          columnKey: "partialTokens",
          onSelectError,
        }),
      enableSorting: false,
      enableHiding: true,
    },
    {
      id: "partialSpend",
      accessorKey: "spend",
      header: () => "Partial Spend",
      cell: ({ row }) =>
        renderErrorCell({
          errorLog: row.original,
          columnKey: "partialSpend",
          onSelectError,
        }),
      enableSorting: false,
      enableHiding: true,
    },
    {
      id: "actions",
      enableHiding: false,
      header: () => "",
      cell: ({ row }) =>
        renderErrorCell({
          errorLog: row.original,
          columnKey: "actions",
          onSelectError,
        }),
    },
  ];
}
