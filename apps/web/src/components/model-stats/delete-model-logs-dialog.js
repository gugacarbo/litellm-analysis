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
export function DeleteModelLogsDialog({
  open,
  deleting,
  onOpenChange,
  onCancel,
  onConfirm,
}) {
  const modelLabel = deleting?.trim() ? deleting : "(no model)";
  return _jsx(AlertDialog, {
    open: open,
    onOpenChange: onOpenChange,
    children: _jsxs(AlertDialogContent, {
      children: [
        _jsxs(AlertDialogHeader, {
          children: [
            _jsx(AlertDialogTitle, { children: "Delete Model Logs" }),
            _jsxs(AlertDialogDescription, {
              children: [
                'Are you sure you want to delete all logs for model "',
                modelLabel,
                '"? This action cannot be undone.',
              ],
            }),
          ],
        }),
        _jsxs(AlertDialogFooter, {
          children: [
            _jsx(AlertDialogCancel, { onClick: onCancel, children: "Cancel" }),
            _jsx(AlertDialogAction, { onClick: onConfirm, children: "Delete" }),
          ],
        }),
      ],
    }),
  });
}
