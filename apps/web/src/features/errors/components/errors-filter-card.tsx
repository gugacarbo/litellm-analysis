import { GenericFilterCard } from "@/components/filters/generic-filter-card";

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

export function ErrorsFilterCard(props: ErrorsFilterCardProps) {
  return (
    <GenericFilterCard
      title="Error Filters"
      models={props.models}
      filters={props.values}
      onFilterChange={props.onValuesChange}
      onApply={props.onApply}
      onClear={props.onClear}
      error={props.error}
    />
  );
}
