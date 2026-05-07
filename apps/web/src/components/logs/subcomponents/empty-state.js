import { jsx as _jsx } from "react/jsx-runtime";
import { TableCell, TableRow } from "../../ui/table";
export function EmptyState({ tableColumnsLength, message = "No logs found" }) {
  return _jsx(TableRow, {
    children: _jsx(TableCell, {
      colSpan: tableColumnsLength,
      className: "py-8 text-center text-muted-foreground",
      children: message,
    }),
  });
}
