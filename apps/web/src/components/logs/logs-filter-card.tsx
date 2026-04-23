import { Button } from '../button';
import { Card } from '../card';
import { Input } from '../input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../select';

export type LogsFilterValues = {
  model: string;
  user: string;
  startDate: string;
  endDate: string;
};

type LogsFilterCardProps = {
  models: string[];
  values: LogsFilterValues;
  error: string | null;
  onValuesChange: (values: LogsFilterValues) => void;
  onApply: () => void;
  onClear: () => void;
};

export function LogsFilterCard({
  models,
  values,
  error,
  onValuesChange,
  onApply,
  onClear,
}: LogsFilterCardProps) {
  return (
    <Card className="p-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
        <Select
          value={values.model}
          onValueChange={(model) => onValuesChange({ ...values, model })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Model" />
          </SelectTrigger>
          <SelectContent>
            {models.map((model) => (
              <SelectItem key={model} value={model}>
                {model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          placeholder="User"
          value={values.user}
          onChange={(e) => onValuesChange({ ...values, user: e.target.value })}
        />

        <Input
          type="date"
          placeholder="Start Date"
          value={values.startDate}
          onChange={(e) =>
            onValuesChange({ ...values, startDate: e.target.value })
          }
        />

        <Input
          type="date"
          placeholder="End Date"
          value={values.endDate}
          onChange={(e) =>
            onValuesChange({ ...values, endDate: e.target.value })
          }
        />

        <div className="flex gap-2">
          <Button onClick={onApply}>Apply</Button>
          <Button variant="outline" onClick={onClear}>
            Clear
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {error}
        </div>
      )}
    </Card>
  );
}
