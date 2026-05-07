import { Database, Pencil, Trash2 } from "lucide-react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import {
  getContextWindow,
  getInputCost,
  getMaxOutput,
  getOutputCost,
} from "../../pages/models/models-utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
export function ModelsTableCard({
  models,
  loading,
  error,
  deleteModelName,
  onDeleteModelNameChange,
  onOpenEdit,
  onDelete,
}) {
  return _jsxs(Card, {
    children: [
      _jsx(CardHeader, {
        children: _jsxs(CardTitle, {
          className: "flex items-center gap-2",
          children: [
            _jsx(Database, { className: "h-5 w-5" }),
            "Configured Models",
          ],
        }),
      }),
      _jsxs(CardContent, {
        children: [
          error &&
            _jsxs("div", {
              className: "p-4 text-destructive",
              children: ["Error: ", error],
            }),
          loading
            ? _jsx("div", {
                className: "space-y-2",
                children: Array.from({ length: 5 }).map((_, i) =>
                  _jsx(Skeleton, { className: "h-12 w-full" }, i),
                ),
              })
            : models.length === 0
              ? _jsx("div", {
                  className: "py-8 text-center text-muted-foreground",
                  children:
                    "No models configured. Add your first model to get started.",
                })
              : _jsxs(Table, {
                  children: [
                    _jsx(TableHeader, {
                      children: _jsxs(TableRow, {
                        children: [
                          _jsx(TableHead, { children: "Model Name" }),
                          _jsx(TableHead, {
                            className: "text-right",
                            children: "Context",
                          }),
                          _jsx(TableHead, {
                            className: "text-right",
                            children: "Max Output",
                          }),
                          _jsx(TableHead, {
                            className: "text-right",
                            children: "Input ($/Mi)",
                          }),
                          _jsx(TableHead, {
                            className: "text-right",
                            children: "Output ($/Mi)",
                          }),
                          _jsx(TableHead, {
                            className: "text-right",
                            children: "Actions",
                          }),
                        ],
                      }),
                    }),
                    _jsx(TableBody, {
                      children: models.map((model) =>
                        _jsxs(
                          TableRow,
                          {
                            children: [
                              _jsx(TableCell, {
                                className: "font-medium",
                                children: model.modelName,
                              }),
                              _jsx(TableCell, {
                                className: "text-right",
                                children: getContextWindow(model.litellmParams),
                              }),
                              _jsx(TableCell, {
                                className: "text-right",
                                children: getMaxOutput(model.litellmParams),
                              }),
                              _jsx(TableCell, {
                                className: "text-right",
                                children: getInputCost(model.litellmParams),
                              }),
                              _jsx(TableCell, {
                                className: "text-right",
                                children: getOutputCost(model.litellmParams),
                              }),
                              _jsx(TableCell, {
                                className: "text-right",
                                children: _jsxs("div", {
                                  className: "flex justify-end gap-2",
                                  children: [
                                    _jsx(Button, {
                                      variant: "ghost",
                                      size: "icon-sm",
                                      onClick: () => onOpenEdit(model),
                                      children: _jsx(Pencil, {
                                        className: "h-4 w-4",
                                      }),
                                    }),
                                    _jsxs(AlertDialog, {
                                      children: [
                                        _jsx(AlertDialogTrigger, {
                                          asChild: true,
                                          children: _jsx(Button, {
                                            variant: "ghost",
                                            size: "icon-sm",
                                            onClick: () =>
                                              onDeleteModelNameChange(
                                                model.modelName,
                                              ),
                                            children: _jsx(Trash2, {
                                              className: "h-4 w-4",
                                            }),
                                          }),
                                        }),
                                        _jsxs(AlertDialogContent, {
                                          children: [
                                            _jsxs(AlertDialogHeader, {
                                              children: [
                                                _jsx(AlertDialogTitle, {
                                                  children: "Delete Model",
                                                }),
                                                _jsxs(AlertDialogDescription, {
                                                  children: [
                                                    "Are you sure you want to delete",
                                                    " ",
                                                    _jsx("span", {
                                                      className:
                                                        "font-semibold",
                                                      children: deleteModelName,
                                                    }),
                                                    "? This action cannot be undone.",
                                                  ],
                                                }),
                                              ],
                                            }),
                                            _jsxs(AlertDialogFooter, {
                                              children: [
                                                _jsx(AlertDialogCancel, {
                                                  onClick: () =>
                                                    onDeleteModelNameChange(
                                                      null,
                                                    ),
                                                  children: "Cancel",
                                                }),
                                                _jsx(AlertDialogAction, {
                                                  asChild: true,
                                                  children: _jsx(Button, {
                                                    variant: "destructive",
                                                    size: "sm",
                                                    onClick: onDelete,
                                                    children: "Delete",
                                                  }),
                                                }),
                                              ],
                                            }),
                                          ],
                                        }),
                                      ],
                                    }),
                                  ],
                                }),
                              }),
                            ],
                          },
                          model.modelName,
                        ),
                      ),
                    }),
                  ],
                }),
        ],
      }),
    ],
  });
}
