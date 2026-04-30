import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";

export type AlertFiltersState = {
  anomalyType: string;
  severity: string;
  model: string;
};

type AlertFiltersProps = {
  values: AlertFiltersState;
  onValuesChange: (values: AlertFiltersState) => void;
  onApply: () => void;
  onClear: () => void;
};

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

export function AlertFilters({
  values,
  onValuesChange,
  onApply,
  onClear,
}: AlertFiltersProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={values.anomalyType || ALL_TYPES_VALUE}
        onValueChange={(anomalyType) =>
          onValuesChange({
            ...values,
            anomalyType: anomalyType === ALL_TYPES_VALUE ? "" : anomalyType,
          })
        }
      >
        <SelectTrigger className="h-8 w-[140px]">
          <SelectValue placeholder="All types" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_TYPES_VALUE}>All types</SelectItem>
          {ANOMALY_TYPES.map((t) => (
            <SelectItem key={t.value} value={t.value}>
              {t.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={values.severity || ALL_SEVERITIES_VALUE}
        onValueChange={(severity) =>
          onValuesChange({
            ...values,
            severity: severity === ALL_SEVERITIES_VALUE ? "" : severity,
          })
        }
      >
        <SelectTrigger className="h-8 w-[140px]">
          <SelectValue placeholder="All severities" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL_SEVERITIES_VALUE}>All severities</SelectItem>
          {SEVERITIES.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Input
        className="h-8 w-[160px]"
        placeholder="Filter by model..."
        value={values.model}
        onChange={(e) => onValuesChange({ ...values, model: e.target.value })}
      />

      <Button size="sm" onClick={onApply}>
        Apply
      </Button>
      <Button size="sm" variant="outline" onClick={onClear}>
        Clear
      </Button>
    </div>
  );
}
