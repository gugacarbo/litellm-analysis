export type LogColumnKey =
  | "latencyHeat"
  | "time"
  | "model"
  | "inputTokens"
  | "outputTokens"
  | "totalTokens"
  | "duration"
  | "timeToFirstToken"
  | "tokensPerSecond"
  | "totalCost"
  | "status"
  | "requestId";

export type LogColumn = {
  key: LogColumnKey;
  label: string;
  align?: "right";
  defaultVisible?: boolean;
};

export type TableColumn =
  | LogColumn
  | { key: "actions"; label: ""; align?: "right" };

export const LOG_COLUMNS: LogColumn[] = [
  { key: "time", label: "Time" },
  { key: "model", label: "Model" },
  {
    key: "inputTokens",
    label: "Input Tokens",
    align: "right",
  },
  {
    key: "outputTokens",
    label: "Output Tokens",
    align: "right",
  },
  { key: "totalTokens", label: "Total Tokens", align: "right" },
  { key: "duration", label: "Duration (ms)", align: "right" },
  { key: "timeToFirstToken", label: "TTFT (ms)", align: "right" },
  {
    key: "latencyHeat",
    label: "Latency",
    align: "right" as const,
    defaultVisible: false,
  },
  { key: "tokensPerSecond", label: "Tokens/s", align: "right" },
  { key: "totalCost", label: "Cost", align: "right" },
  { key: "status", label: "Status" },
  {
    key: "requestId",
    label: "Request ID",
    defaultVisible: false,
  },
];

export const DEFAULT_VISIBLE_LOG_COLUMNS: LogColumnKey[] = LOG_COLUMNS.filter(
  (column) => column.defaultVisible !== false,
).map((column) => column.key);
