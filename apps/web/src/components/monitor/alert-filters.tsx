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
    <Card>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="space-y-2">
            <Label htmlFor="alert-type-filter">Type</Label>
            <Select
              value={values.anomalyType || ALL_TYPES_VALUE}
              onValueChange={(anomalyType) =>
                onValuesChange({
                  ...values,
                  anomalyType:
                    anomalyType === ALL_TYPES_VALUE ? "" : anomalyType,
                })
              }
            >
              <SelectTrigger id="alert-type-filter">
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="alert-severity-filter">Severity</Label>
            <Select
              value={values.severity || ALL_SEVERITIES_VALUE}
              onValueChange={(severity) =>
                onValuesChange({
                  ...values,
                  severity: severity === ALL_SEVERITIES_VALUE ? "" : severity,
                })
              }
            >
              <SelectTrigger id="alert-severity-filter">
                <SelectValue placeholder="All severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_SEVERITIES_VALUE}>
                  All severities
                </SelectItem>
                {SEVERITIES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="alert-model-filter">Model</Label>
            <Input
              id="alert-model-filter"
              placeholder="Filter by model..."
              value={values.model}
              onChange={(e) =>
                onValuesChange({ ...values, model: e.target.value })
              }
            />
          </div>

          <div className="flex items-end gap-2">
            <Button className="flex-1" onClick={onApply}>
              Apply
            </Button>
            <Button className="flex-1" variant="outline" onClick={onClear}>
              Clear
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
