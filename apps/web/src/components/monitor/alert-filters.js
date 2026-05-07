import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

const ALL_TYPES_VALUE = "__all_types__";
const ALL_SEVERITIES_VALUE = "__all_severities__";
const ANOMALY_TYPES = [
  { value: "model_offline", label: "Model Offline" },
  { value: "error_spike", label: "Error Spike" },
  { value: "timeout_stuck", label: "Timeout/Stuck" },
  { value: "silent_failure", label: "Silent Failure" },
];
const SEVERITIES = [
  { value: "critical", label: "Critical" },
  { value: "warning", label: "Warning" },
  { value: "info", label: "Info" },
];
export function AlertFilters({ values, onValuesChange, onApply, onClear }) {
  return _jsxs("div", {
    className: "flex flex-wrap items-center gap-2",
    children: [
      _jsxs(Select, {
        value: values.anomalyType || ALL_TYPES_VALUE,
        onValueChange: (anomalyType) =>
          onValuesChange({
            ...values,
            anomalyType: anomalyType === ALL_TYPES_VALUE ? "" : anomalyType,
          }),
        children: [
          _jsx(SelectTrigger, {
            className: "h-8 w-[140px]",
            children: _jsx(SelectValue, { placeholder: "All types" }),
          }),
          _jsxs(SelectContent, {
            children: [
              _jsx(SelectItem, {
                value: ALL_TYPES_VALUE,
                children: "All types",
              }),
              ANOMALY_TYPES.map((t) =>
                _jsx(
                  SelectItem,
                  { value: t.value, children: t.label },
                  t.value,
                ),
              ),
            ],
          }),
        ],
      }),
      _jsxs(Select, {
        value: values.severity || ALL_SEVERITIES_VALUE,
        onValueChange: (severity) =>
          onValuesChange({
            ...values,
            severity: severity === ALL_SEVERITIES_VALUE ? "" : severity,
          }),
        children: [
          _jsx(SelectTrigger, {
            className: "h-8 w-[140px]",
            children: _jsx(SelectValue, { placeholder: "All severities" }),
          }),
          _jsxs(SelectContent, {
            children: [
              _jsx(SelectItem, {
                value: ALL_SEVERITIES_VALUE,
                children: "All severities",
              }),
              SEVERITIES.map((s) =>
                _jsx(
                  SelectItem,
                  { value: s.value, children: s.label },
                  s.value,
                ),
              ),
            ],
          }),
        ],
      }),
      _jsx(Input, {
        className: "h-8 w-[160px]",
        placeholder: "Filter by model...",
        value: values.model,
        onChange: (e) => onValuesChange({ ...values, model: e.target.value }),
      }),
      _jsx(Button, { size: "sm", onClick: onApply, children: "Apply" }),
      _jsx(Button, {
        size: "sm",
        variant: "outline",
        onClick: onClear,
        children: "Clear",
      }),
    ],
  });
}
