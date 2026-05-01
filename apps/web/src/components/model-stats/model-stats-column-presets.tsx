import { ListFilter } from "lucide-react";
import type { ColumnKey } from "../../pages/model-stats/model-stats-types";
import { MODEL_STATS_COLUMNS } from "../../pages/model-stats/model-stats-types";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export type ModelStatsColumnPresetKey =
  | "essential"
  | "performance"
  | "complete";

type ColumnPreset = {
  key: ModelStatsColumnPresetKey;
  label: string;
  columns: ColumnKey[];
};

const ESSENTIAL_COLUMNS: ColumnKey[] = [
  "model",
  "requests",
  "spend",
  "percent",
  "tokens",
  "latency",
  "success",
  "errors",
  "actions",
];

const PERFORMANCE_COLUMNS: ColumnKey[] = [
  "model",
  "requests",
  "avgTok",
  "tokPerSec",
  "latency",
  "p50",
  "p95",
  "p99",
  "success",
  "errorRate",
  "costPer1k",
  "actions",
];

const COMPLETE_COLUMNS: ColumnKey[] = MODEL_STATS_COLUMNS.map(
  (column) => column.key,
);

export const MODEL_STATS_COLUMN_PRESETS: ColumnPreset[] = [
  {
    key: "essential",
    label: "Essential",
    columns: ESSENTIAL_COLUMNS,
  },
  {
    key: "performance",
    label: "Performance",
    columns: PERFORMANCE_COLUMNS,
  },
  {
    key: "complete",
    label: "Complete",
    columns: COMPLETE_COLUMNS,
  },
];

function sortColumns(columns: ColumnKey[]): ColumnKey[] {
  const orderMap = new Map(
    MODEL_STATS_COLUMNS.map((column, index) => [column.key, index]),
  );

  return [...columns].sort((a, b) => {
    const indexA = orderMap.get(a) ?? 0;
    const indexB = orderMap.get(b) ?? 0;
    return indexA - indexB;
  });
}

function columnsMatchPreset(
  visibleColumns: ColumnKey[],
  presetColumns: ColumnKey[],
): boolean {
  if (visibleColumns.length !== presetColumns.length) return false;

  const sortedVisible = sortColumns(visibleColumns);
  const sortedPreset = sortColumns(presetColumns);

  return sortedVisible.every((column, index) => column === sortedPreset[index]);
}

function getActivePreset(
  visibleColumns: ColumnKey[],
): ModelStatsColumnPresetKey | "custom" {
  for (const preset of MODEL_STATS_COLUMN_PRESETS) {
    if (columnsMatchPreset(visibleColumns, preset.columns)) {
      return preset.key;
    }
  }

  return "custom";
}

type ModelStatsColumnPresetsProps = {
  visibleColumns: ColumnKey[];
  onApplyPreset: (columns: ColumnKey[]) => void;
};

export function ModelStatsColumnPresets({
  visibleColumns,
  onApplyPreset,
}: ModelStatsColumnPresetsProps) {
  const activePreset = getActivePreset(visibleColumns);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <ListFilter className="mr-1 h-3.5 w-3.5" />
          Preset
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Column Presets</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup value={activePreset}>
          {MODEL_STATS_COLUMN_PRESETS.map((preset) => (
            <DropdownMenuRadioItem
              key={preset.key}
              value={preset.key}
              onSelect={() => onApplyPreset(preset.columns)}
            >
              {preset.label}
            </DropdownMenuRadioItem>
          ))}
          {activePreset === "custom" ? (
            <DropdownMenuRadioItem value="custom">Custom</DropdownMenuRadioItem>
          ) : null}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
