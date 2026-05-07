import { AlertCircle } from "lucide-react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const ALL_MODELS_VALUE = "__all_models__";
export function ErrorsFilterCard({
  models,
  values,
  error,
  onValuesChange,
  onApply,
  onClear,
}) {
  return _jsx(Card, {
    children: _jsxs(CardContent, {
      className: "space-y-4",
      children: [
        _jsxs("div", {
          className: "grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5",
          children: [
            _jsxs("div", {
              className: "space-y-2",
              children: [
                _jsx(Label, {
                  htmlFor: "errors-model-filter",
                  children: "Model",
                }),
                _jsxs(Select, {
                  value: values.model || ALL_MODELS_VALUE,
                  onValueChange: (model) =>
                    onValuesChange({
                      ...values,
                      model: model === ALL_MODELS_VALUE ? "" : model,
                    }),
                  children: [
                    _jsx(SelectTrigger, {
                      id: "errors-model-filter",
                      children: _jsx(SelectValue, {
                        placeholder: "All models",
                      }),
                    }),
                    _jsxs(SelectContent, {
                      children: [
                        _jsx(SelectItem, {
                          value: ALL_MODELS_VALUE,
                          children: "All models",
                        }),
                        models.map((model) =>
                          _jsx(
                            SelectItem,
                            { value: model, children: model },
                            model,
                          ),
                        ),
                      ],
                    }),
                  ],
                }),
              ],
            }),
            _jsxs("div", {
              className: "space-y-2",
              children: [
                _jsx(Label, {
                  htmlFor: "errors-user-filter",
                  children: "User",
                }),
                _jsx(Input, {
                  id: "errors-user-filter",
                  placeholder: "User id",
                  value: values.user,
                  onChange: (event) =>
                    onValuesChange({ ...values, user: event.target.value }),
                }),
              ],
            }),
            _jsxs("div", {
              className: "space-y-2",
              children: [
                _jsx(Label, {
                  htmlFor: "errors-start-date-filter",
                  children: "Start date",
                }),
                _jsx(Input, {
                  id: "errors-start-date-filter",
                  type: "date",
                  value: values.startDate,
                  onChange: (event) =>
                    onValuesChange({
                      ...values,
                      startDate: event.target.value,
                    }),
                }),
              ],
            }),
            _jsxs("div", {
              className: "space-y-2",
              children: [
                _jsx(Label, {
                  htmlFor: "errors-end-date-filter",
                  children: "End date",
                }),
                _jsx(Input, {
                  id: "errors-end-date-filter",
                  type: "date",
                  value: values.endDate,
                  onChange: (event) =>
                    onValuesChange({ ...values, endDate: event.target.value }),
                }),
              ],
            }),
            _jsxs("div", {
              className: "flex items-end gap-2",
              children: [
                _jsx(Button, {
                  className: "flex-1",
                  onClick: onApply,
                  children: "Apply",
                }),
                _jsx(Button, {
                  className: "flex-1",
                  variant: "outline",
                  onClick: onClear,
                  children: "Clear",
                }),
              ],
            }),
          ],
        }),
        error &&
          _jsxs("div", {
            className:
              "flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive",
            children: [
              _jsx(AlertCircle, { className: "mt-0.5 h-4 w-4 shrink-0" }),
              _jsx("span", { children: error }),
            ],
          }),
      ],
    }),
  });
}
