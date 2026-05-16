import { GenericFilterCard } from "../filters/generic-filter-card";

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

export function LogsFilterCard(props: LogsFilterCardProps) {
  return (
    <GenericFilterCard
      title="Log Filters"
      models={props.models}
      filters={props.values}
      onFilterChange={props.onValuesChange}
      onApply={props.onApply}
      onClear={props.onClear}
      error={props.error}
    />
  );
}
