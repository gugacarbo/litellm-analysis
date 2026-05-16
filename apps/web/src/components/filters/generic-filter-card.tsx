import { AlertCircle } from "lucide-react";
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

export type GenericFilterValues = {
  model: string;
  user: string;
  startDate: string;
  endDate: string;
};

type GenericFilterCardProps = {
  title: string;
  models: string[];
  filters: GenericFilterValues;
  onFilterChange: (filters: GenericFilterValues) => void;
  onApply: () => void;
  onClear: () => void;
  error?: string | null;
};

const ALL_MODELS_VALUE = "__all_models__";

export function GenericFilterCard({
  title,
  models,
  filters,
  error,
  onFilterChange,
  onApply,
  onClear,
}: GenericFilterCardProps) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <h3 className="text-sm font-medium">{title}</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <div className="space-y-2">
            <Label htmlFor="filter-model">Model</Label>
            <Select
              value={filters.model || ALL_MODELS_VALUE}
              onValueChange={(model) =>
                onFilterChange({
                  ...filters,
                  model: model === ALL_MODELS_VALUE ? "" : model,
                })
              }
            >
              <SelectTrigger id="filter-model">
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
            <Label htmlFor="filter-user">User</Label>
            <Input
              id="filter-user"
              placeholder="User id"
              value={filters.user}
              onChange={(event) =>
                onFilterChange({ ...filters, user: event.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-start-date">Start date</Label>
            <Input
              id="filter-start-date"
              type="date"
              value={filters.startDate}
              onChange={(event) =>
                onFilterChange({ ...filters, startDate: event.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="filter-end-date">End date</Label>
            <Input
              id="filter-end-date"
              type="date"
              value={filters.endDate}
              onChange={(event) =>
                onFilterChange({ ...filters, endDate: event.target.value })
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
