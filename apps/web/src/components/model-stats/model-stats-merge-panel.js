import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
export function ModelStatsMergePanel({
  data,
  sourceModel,
  targetModel,
  merging,
  onSourceModelChange,
  onTargetModelChange,
  onMerge,
}) {
  const models = data.filter((m) => m.model);
  return _jsx(Card, {
    children: _jsxs(CardContent, {
      className: "pt-4 flex items-center gap-2 flex-wrap",
      children: [
        _jsxs(Select, {
          value: sourceModel,
          onValueChange: onSourceModelChange,
          children: [
            _jsx(SelectTrigger, {
              className: "w-48",
              children: _jsx(SelectValue, { placeholder: "Source model" }),
            }),
            _jsx(SelectContent, {
              children: models.map((m) =>
                _jsx(
                  SelectItem,
                  {
                    value: m.model,
                    disabled: m.model === targetModel,
                    children: m.model,
                  },
                  m.model,
                ),
              ),
            }),
          ],
        }),
        _jsx("span", { children: "\u2192" }),
        _jsxs(Select, {
          value: targetModel,
          onValueChange: onTargetModelChange,
          children: [
            _jsx(SelectTrigger, {
              className: "w-48",
              children: _jsx(SelectValue, { placeholder: "Target model" }),
            }),
            _jsx(SelectContent, {
              children: models.map((m) =>
                _jsx(
                  SelectItem,
                  {
                    value: m.model,
                    disabled: m.model === sourceModel,
                    children: m.model,
                  },
                  m.model,
                ),
              ),
            }),
          ],
        }),
        _jsx(Button, {
          size: "sm",
          variant: "default",
          disabled: merging || !sourceModel || !targetModel,
          onClick: onMerge,
          children: merging ? "Merging..." : "Merge",
        }),
      ],
    }),
  });
}
