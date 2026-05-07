export const ERROR_COLUMNS = [
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
    align: "right",
    defaultVisible: false,
  },
  {
    key: "partialSpend",
    label: "Partial Spend",
    align: "right",
    defaultVisible: false,
  },
];
export const ACTIONS_COLUMN = {
  key: "actions",
  label: "",
  align: "right",
};
export const DEFAULT_VISIBLE_ERROR_COLUMNS = ERROR_COLUMNS.filter(
  (column) => column.defaultVisible !== false,
).map((column) => column.key);
