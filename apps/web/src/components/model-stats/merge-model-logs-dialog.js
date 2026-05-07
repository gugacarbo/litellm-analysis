import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";
export function MergeModelLogsDialog({
  open,
  sourceModel,
  targetModel,
  sourceModelCount,
  onOpenChange,
  onConfirm,
}) {
  return _jsx(AlertDialog, {
    open: open,
    onOpenChange: onOpenChange,
    children: _jsxs(AlertDialogContent, {
      children: [
        _jsxs(AlertDialogHeader, {
          children: [
            _jsx(AlertDialogTitle, { children: "Merge Model Logs" }),
            _jsxs(AlertDialogDescription, {
              children: [
                'Are you sure you want to merge all logs from "',
                sourceModel,
                '" into "',
                targetModel,
                '"? This will update ',
                sourceModelCount,
                " records.",
              ],
            }),
          ],
        }),
        _jsxs(AlertDialogFooter, {
          children: [
            _jsx(AlertDialogCancel, { children: "Cancel" }),
            _jsx(AlertDialogAction, { onClick: onConfirm, children: "Merge" }),
          ],
        }),
      ],
    }),
  });
}
