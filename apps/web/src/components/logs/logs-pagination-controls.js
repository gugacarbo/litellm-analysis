import {
  Fragment as _Fragment,
  jsx as _jsx,
  jsxs as _jsxs,
} from "react/jsx-runtime";
import { Button } from "../ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
export function LogsPaginationControls({
  page,
  pageSize,
  pagination,
  onPageChange,
  onPageSizeChange,
}) {
  const isAll = pageSize === 0;
  const hasEntries = pagination.total > 0;
  const startEntry = hasEntries
    ? (page - 1) * (isAll ? pagination.total : pageSize) + 1
    : 0;
  const endEntry = isAll
    ? pagination.total
    : hasEntries
      ? Math.min(page * pageSize, pagination.total)
      : 0;
  const totalPages = isAll ? 1 : pagination.total_pages || 1;
  return _jsxs("div", {
    className:
      "flex flex-col sm:flex-row items-center justify-between pt-4 gap-4",
    children: [
      _jsx("div", {
        className: "text-sm text-muted-foreground",
        children: isAll
          ? `Showing all ${pagination.total} entries`
          : `Showing ${startEntry}-${endEntry} of ${pagination.total} entries`,
      }),
      _jsxs("div", {
        className: "flex items-center gap-2",
        children: [
          !isAll &&
            _jsxs(_Fragment, {
              children: [
                _jsx(Button, {
                  variant: "outline",
                  size: "sm",
                  onClick: () => onPageChange(page - 1),
                  disabled: page === 1,
                  children: "Previous",
                }),
                _jsxs("span", {
                  className: "text-sm px-2",
                  children: ["Page ", page, " of ", totalPages],
                }),
                _jsx(Button, {
                  variant: "outline",
                  size: "sm",
                  onClick: () => onPageChange(page + 1),
                  disabled: page >= totalPages,
                  children: "Next",
                }),
              ],
            }),
          _jsxs(Select, {
            value: pageSize.toString(),
            onValueChange: onPageSizeChange,
            children: [
              _jsx(SelectTrigger, {
                className: "w-24",
                children: _jsx(SelectValue, {}),
              }),
              _jsxs(SelectContent, {
                children: [
                  _jsx(SelectItem, { value: "10", children: "10/page" }),
                  _jsx(SelectItem, { value: "25", children: "25/page" }),
                  _jsx(SelectItem, { value: "50", children: "50/page" }),
                  _jsx(SelectItem, { value: "100", children: "100/page" }),
                  _jsx(SelectItem, { value: "200", children: "200/page" }),
                  _jsx(SelectItem, { value: "500", children: "500/page" }),
                  _jsx(SelectItem, { value: "1000", children: "1000/page" }),
                  _jsx(SelectItem, { value: "0", children: "All" }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}
