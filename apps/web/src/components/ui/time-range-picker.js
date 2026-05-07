import { useState } from "react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

const PRESET_BUTTON_LABELS = {
  "15m": "15m",
  "1h": "1h",
  "5h": "5h",
  "12h": "12h",
  "24h": "24h",
  "7d": "7d",
  "14d": "14d",
  "30d": "30d",
};
export function TimeRangePicker({
  value,
  onChange,
  presets = ["15m", "1h", "5h", "12h", "24h", "7d", "14d", "30d"],
  showCustom = true,
}) {
  const [customFrom, setCustomFrom] = useState(
    value.from ? toDatetimeLocalString(value.from) : "",
  );
  const [customTo, setCustomTo] = useState(
    value.to ? toDatetimeLocalString(value.to) : "",
  );
  const [popoverOpen, setPopoverOpen] = useState(false);
  const handlePresetClick = (key) => {
    onChange({ preset: key });
  };
  const handleCustomApply = () => {
    if (customFrom && customTo) {
      onChange({
        preset: "custom",
        from: new Date(customFrom),
        to: new Date(customTo),
      });
      setPopoverOpen(false);
    }
  };
  const handlePopoverOpenChange = (open) => {
    if (open) {
      // Sync from/to values when opening the popover
      setCustomFrom(value.from ? toDatetimeLocalString(value.from) : "");
      setCustomTo(value.to ? toDatetimeLocalString(value.to) : "");
    }
    setPopoverOpen(open);
  };
  const isCustomActive =
    value.preset === "custom" && !!value.from && !!value.to;
  return _jsxs("div", {
    className: "flex items-center gap-2 flex-wrap",
    children: [
      presets.map((key) => {
        const label = PRESET_BUTTON_LABELS[key] ?? key;
        const isActive = value.preset === key;
        return _jsx(
          Button,
          {
            variant: isActive ? "default" : "outline",
            size: "sm",
            onClick: () => handlePresetClick(key),
            children: label,
          },
          key,
        );
      }),
      showCustom &&
        _jsxs(Popover, {
          open: popoverOpen,
          onOpenChange: handlePopoverOpenChange,
          children: [
            _jsx(PopoverTrigger, {
              asChild: true,
              children: _jsx(Button, {
                variant: isCustomActive ? "default" : "outline",
                size: "sm",
                children: "Custom",
              }),
            }),
            _jsx(PopoverContent, {
              className: "w-80",
              align: "end",
              children: _jsxs("div", {
                className: "space-y-4",
                children: [
                  _jsx("h4", {
                    className: "text-sm font-medium",
                    children: "Custom Range",
                  }),
                  _jsxs("div", {
                    className: "space-y-3",
                    children: [
                      _jsxs("div", {
                        className: "space-y-1.5",
                        children: [
                          _jsx("label", {
                            className: "text-xs text-muted-foreground",
                            children: "From",
                          }),
                          _jsx(Input, {
                            type: "datetime-local",
                            value: customFrom,
                            onChange: (e) => setCustomFrom(e.target.value),
                          }),
                        ],
                      }),
                      _jsxs("div", {
                        className: "space-y-1.5",
                        children: [
                          _jsx("label", {
                            className: "text-xs text-muted-foreground",
                            children: "To",
                          }),
                          _jsx(Input, {
                            type: "datetime-local",
                            value: customTo,
                            onChange: (e) => setCustomTo(e.target.value),
                          }),
                        ],
                      }),
                    ],
                  }),
                  _jsxs("div", {
                    className: "flex justify-end gap-2",
                    children: [
                      _jsx(Button, {
                        variant: "outline",
                        size: "sm",
                        onClick: () => setPopoverOpen(false),
                        children: "Cancel",
                      }),
                      _jsx(Button, {
                        size: "sm",
                        onClick: handleCustomApply,
                        disabled: !customFrom || !customTo,
                        children: "Apply",
                      }),
                    ],
                  }),
                ],
              }),
            }),
          ],
        }),
    ],
  });
}
function toDatetimeLocalString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
