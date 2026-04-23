import { AlertCircle } from 'lucide-react';
import { Button } from '../button';
import { Card, CardContent } from '../card';
import { Input } from '../input';
import { Label } from '../label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../select';

export type ErrorsFilterValues = {
  model: string;
  user: string;
  startDate: string;
  endDate: string;
};

type ErrorsFilterCardProps = {
  models: string[];
  values: ErrorsFilterValues;
  error: string | null;
  onValuesChange: (values: ErrorsFilterValues) => void;
  onApply: () => void;
  onClear: () => void;
};

const ALL_MODELS_VALUE = '__all_models__';

export function ErrorsFilterCard({
  models,
  values,
  error,
  onValuesChange,
  onApply,
  onClear,
}: ErrorsFilterCardProps) {
  return (
    <Card>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="space-y-2">
            <Label htmlFor="errors-model-filter">Model</Label>
            <Select
              value={values.model || ALL_MODELS_VALUE}
              onValueChange={(model) =>
                onValuesChange({
                  ...values,
                  model: model === ALL_MODELS_VALUE ? '' : model,
                })
              }
            >
              <SelectTrigger id="errors-model-filter">
                <SelectValue placeholder="All models" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_MODELS_VALUE}>All models</SelectItem>
                {models.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="errors-user-filter">User</Label>
            <Input
              id="errors-user-filter"
              placeholder="User id"
              value={values.user}
              onChange={(event) =>
                onValuesChange({ ...values, user: event.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="errors-start-date-filter">Start date</Label>
            <Input
              id="errors-start-date-filter"
              type="date"
              value={values.startDate}
              onChange={(event) =>
                onValuesChange({
                  ...values,
                  startDate: event.target.value,
                })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="errors-end-date-filter">End date</Label>
            <Input
              id="errors-end-date-filter"
              type="date"
              value={values.endDate}
              onChange={(event) =>
                onValuesChange({ ...values, endDate: event.target.value })
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

        {error && (
          <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
