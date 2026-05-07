export const LOG_COLUMNS = [
  { key: "time", label: "Time" },
  { key: "model", label: "Model" },
  {
    key: "user",
    label: "User",
    defaultVisible: false,
  },
  {
    key: "promptTokens",
    label: "Prompt Tokens",
    align: "right",
  },
  {
    key: "completionTokens",
    label: "Completion Tokens",
    align: "right",
  },
  { key: "totalTokens", label: "Total Tokens", align: "right" },
  { key: "duration", label: "Duration (ms)", align: "right" },
  { key: "timeToFirstToken", label: "TTFT (ms)", align: "right" },
  {
    key: "latencyHeat",
    label: "Latency",
    align: "right",
    defaultVisible: false,
  },
  { key: "tokensPerSecond", label: "Tokens/s", align: "right" },
  { key: "spend", label: "Spend", align: "right" },
  { key: "status", label: "Status" },
  {
    key: "requestId",
    label: "Request ID",
    defaultVisible: false,
  },
];
export const ACTIONS_COLUMN = {
  key: "actions",
  label: "",
  align: "right",
};
export const DEFAULT_VISIBLE_LOG_COLUMNS = LOG_COLUMNS.filter(
  (column) => column.defaultVisible !== false,
).map((column) => column.key);
