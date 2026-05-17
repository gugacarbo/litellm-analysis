import { ChevronDownIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { useFilter } from "@/contexts/filter-context";
import type { DashboardDateRangeKey, DateRangeGroup } from "@/lib/date-ranges";
import {
  DAYS_OPTIONS,
  getDateRangeGroup,
  HOURS_OPTIONS,
} from "@/lib/date-ranges";
import { Button } from "./button";
import { Calendar } from "./calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { Label } from "./label";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

const GROUP_LABELS: Record<DateRangeGroup, string> = {
  hours: "Horas",
  days: "Dias",
  custom: "Personalizado",
};

const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const hours = Math.floor(index / 2)
    .toString()
    .padStart(2, "0");
  const minutes = index % 2 === 0 ? "00" : "30";
  return `${hours}:${minutes}`;
});

function DateRangeGroupButton({
  group,
  selectedKey,
  onSelect,
}: {
  group: DateRangeGroup;
  selectedKey: DashboardDateRangeKey;
  onSelect: (key: DashboardDateRangeKey) => void;
}) {
  const groupLabel = GROUP_LABELS[group];
  const isActive = getDateRangeGroup(selectedKey) === group;
  const options = group === "hours" ? HOURS_OPTIONS : DAYS_OPTIONS;
  const currentOption = options.find((o) => o.key === selectedKey);

  if (group === "custom") {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={isActive ? "default" : "outline"}
          size="sm"
          className="h-7 gap-1 px-2 text-xs"
        >
          {currentOption?.label ?? groupLabel}
          <ChevronDownIcon className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {options.map((option) => (
          <DropdownMenuItem
            key={option.key}
            onClick={() => onSelect(option.key)}
            className={option.key === selectedKey ? "bg-accent" : ""}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function CustomRangePicker() {
  const { dateRange, customFrom, customTo, setCustomRange } = useFilter();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [fromDate, setFromDate] = useState<Date | undefined>(undefined);
  const [toDate, setToDate] = useState<Date | undefined>(undefined);
  const [fromTime, setFromTime] = useState("00:00");
  const [toTime, setToTime] = useState("23:30");

  const isCustomActive = dateRange === "custom" && !!customFrom && !!customTo;

  const handleOpenChange = (open: boolean) => {
    if (open) {
      setFromDate(customFrom);
      setToDate(customTo);
      setFromTime(customFrom ? toTimeString(customFrom) : "00:00");
      setToTime(customTo ? toTimeString(customTo) : "23:30");
    }
    setPopoverOpen(open);
  };

  const canApply = Boolean(fromDate && toDate && fromTime && toTime);

  const fromPreview = useMemo(
    () => (fromDate ? formatPreview(fromDate, fromTime) : "Selecione"),
    [fromDate, fromTime],
  );

  const toPreview = useMemo(
    () => (toDate ? formatPreview(toDate, toTime) : "Selecione"),
    [toDate, toTime],
  );

  const handleApply = () => {
    if (!fromDate || !toDate) {
      return;
    }

    const from = applyTime(fromDate, fromTime);
    const to = applyTime(toDate, toTime);

    if (from.getTime() > to.getTime()) {
      return;
    }

    setCustomRange(from, to);
    setPopoverOpen(false);
  };

  return (
    <Popover open={popoverOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant={isCustomActive ? "default" : "outline"}
          size="sm"
          className="h-7 px-2 text-xs"
        >
          {isCustomActive ? "Personalizado" : GROUP_LABELS.custom}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[720px] max-w-[95vw]" align="end">
        <div className="space-y-4">
          <h4 className="text-sm font-medium">Intervalo personalizado</h4>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">De</Label>
              <div className="rounded-md border">
                <Calendar
                  mode="single"
                  selected={fromDate}
                  onSelect={setFromDate}
                />
              </div>
              <Select value={fromTime} onValueChange={setFromTime}>
                <SelectTrigger className="w-full" size="sm">
                  <SelectValue placeholder="Hora" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((option) => (
                    <SelectItem key={`from-${option}`} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{fromPreview}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Até</Label>
              <div className="rounded-md border">
                <Calendar mode="single" selected={toDate} onSelect={setToDate} />
              </div>
              <Select value={toTime} onValueChange={setToTime}>
                <SelectTrigger className="w-full" size="sm">
                  <SelectValue placeholder="Hora" />
                </SelectTrigger>
                <SelectContent>
                  {TIME_OPTIONS.map((option) => (
                    <SelectItem key={`to-${option}`} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">{toPreview}</p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPopoverOpen(false)}
            >
              Cancelar
            </Button>
            <Button size="sm" onClick={handleApply} disabled={!canApply}>
              Aplicar
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function toTimeString(date: Date): string {
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes() < 30 ? "00" : "30";
  return `${hours}:${minutes}`;
}

function applyTime(date: Date, timeValue: string): Date {
  const [hoursRaw, minutesRaw] = timeValue.split(":");
  const next = new Date(date);
  next.setHours(Number(hoursRaw), Number(minutesRaw), 0, 0);
  return next;
}

function formatPreview(date: Date, timeValue: string): string {
  const [hoursRaw, minutesRaw] = timeValue.split(":");
  const previewDate = new Date(date);
  previewDate.setHours(Number(hoursRaw), Number(minutesRaw), 0, 0);

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(previewDate);
}

export function DateRangeFilter() {
  const { dateRange, setDateRange } = useFilter();

  return (
    <div className="flex items-center gap-1">
      <DateRangeGroupButton
        group="hours"
        selectedKey={dateRange}
        onSelect={setDateRange}
      />
      <DateRangeGroupButton
        group="days"
        selectedKey={dateRange}
        onSelect={setDateRange}
      />
      <CustomRangePicker />
    </div>
  );
}
