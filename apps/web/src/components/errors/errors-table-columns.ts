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
