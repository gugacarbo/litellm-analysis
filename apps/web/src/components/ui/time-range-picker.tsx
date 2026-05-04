import { useState } from "react";
import type {
  DashboardDateRangeKey,
  TimeRangeValue,
} from "../../pages/dashboard/dashboard-types";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

const PRESET_BUTTON_LABELS: Record<string, string> = {
  "15m": "15m",
  "1h": "1h",
  "5h": "5h",
  "12h": "12h",
  "24h": "24h",
  "7d": "7d",
  "14d": "14d",
  "30d": "30d",
};

type TimeRangePickerProps = {
  value: TimeRangeValue;
  onChange: (range: TimeRangeValue) => void;
  presets?: DashboardDateRangeKey[];
  showCustom?: boolean;
};

export function TimeRangePicker({
  value,
  onChange,
  presets = ["15m", "1h", "5h", "12h", "24h", "7d", "14d", "30d"],
  showCustom = true,
}: TimeRangePickerProps) {
  const [customFrom, setCustomFrom] = useState<string>(
    value.from ? toDatetimeLocalString(value.from) : "",
  );
  const [customTo, setCustomTo] = useState<string>(
    value.to ? toDatetimeLocalString(value.to) : "",
  );
  const [popoverOpen, setPopoverOpen] = useState(false);

  const handlePresetClick = (key: DashboardDateRangeKey) => {
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

  const handlePopoverOpenChange = (open: boolean) => {
    if (open) {
      // Sync from/to values when opening the popover
      setCustomFrom(value.from ? toDatetimeLocalString(value.from) : "");
      setCustomTo(value.to ? toDatetimeLocalString(value.to) : "");
    }
    setPopoverOpen(open);
  };

  const isCustomActive =
    value.preset === "custom" && !!value.from && !!value.to;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {presets.map((key) => {
        const label = PRESET_BUTTON_LABELS[key] ?? key;
        const isActive = value.preset === key;
        return (
          <Button
            key={key}
            variant={isActive ? "default" : "outline"}
            size="sm"
            onClick={() => handlePresetClick(key)}
          >
            {label}
          </Button>
        );
      })}
      {showCustom && (
        <Popover open={popoverOpen} onOpenChange={handlePopoverOpenChange}>
          <PopoverTrigger asChild>
            <Button variant={isCustomActive ? "default" : "outline"} size="sm">
              Custom
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <h4 className="text-sm font-medium">Custom Range</h4>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">From</label>
                  <Input
                    type="datetime-local"
                    value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">To</label>
                  <Input
                    type="datetime-local"
                    value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPopoverOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleCustomApply}
                  disabled={!customFrom || !customTo}
                >
                  Apply
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  );
}

function toDatetimeLocalString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
