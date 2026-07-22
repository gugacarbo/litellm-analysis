import type {
  ArtificialAnalysisBenchmarkItem,
  BenchmarkAttribution,
  OpenRouterBenchmarkItem,
} from "@lite-llm/contracts/benchmarks";
import { ChevronDownIcon, ChevronRightIcon } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Switch } from "@/shared/components/ui/switch";
import {
  type BenchmarkTableItem,
  groupModelVariants,
  toAaTableItems,
  toOpenRouterTableItems,
} from "./benchmark-table-model";

const currency = (value: number | null) =>
  value === null ? "—" : `$${value.toFixed(2)}`;
const metric = (value: number | null, digits = 1) =>
  value === null ? "—" : value.toFixed(digits);
const percentage = (value: number | null) =>
  value === null ? "—" : `${metric(value)}%`;
const seconds = (value: number | null) =>
  value === null ? "—" : `${metric(value)}s`;

type BenchmarkColumn = {
  key: string;
  label: string;
  render: (item: BenchmarkTableItem) => string;
};

const CORE_COLUMNS: BenchmarkColumn[] = [
  { key: "model", label: "Modelo", render: (item) => item.name },
  {
    key: "provider",
    label: "Provider",
    render: (item) => item.providerName,
  },
];

const AA_COLUMNS: BenchmarkColumn[] = [
  ...CORE_COLUMNS,
  {
    key: "intelligence",
    label: "Inteligência",
    render: (item) => metric(item.intelligenceIndex),
  },
  {
    key: "input-price",
    label: "Input / 1M",
    render: (item) => currency(item.priceInput1mTokens),
  },
  {
    key: "output-price",
    label: "Output / 1M",
    render: (item) => currency(item.priceOutput1mTokens),
  },
];

const OPENROUTER_COLUMNS: BenchmarkColumn[] = [
  ...CORE_COLUMNS,
  {
    key: "arena-category",
    label: "Arena / categoria",
    render: (item) =>
      [item.arena, item.category].filter(Boolean).join(" / ") || "—",
  },
  { key: "elo", label: "ELO", render: (item) => metric(item.elo, 0) },
  {
    key: "win-rate",
    label: "Win rate",
    render: (item) => percentage(item.winRate),
  },
  {
    key: "time",
    label: "Tempo",
    render: (item) => seconds(item.averageTimeSeconds),
  },
  {
    key: "intelligence",
    label: "Índice AA",
    render: (item) => metric(item.intelligenceIndex),
  },
];

function BenchmarkTable({
  columns,
  groupVariants,
  items,
}: {
  columns: BenchmarkColumn[];
  groupVariants: boolean;
  items: BenchmarkTableItem[];
}) {
  const groups = groupVariants ? groupModelVariants(items) : null;
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    () => new Set(),
  );
  const renderRow = (item: BenchmarkTableItem, grouped = false) => (
    <tr className="border-b" key={item.id}>
      {columns.map((column, index) => (
        <td
          className={
            index === 0
              ? grouped
                ? "p-2 pl-6 font-medium"
                : "p-2 font-medium"
              : "p-2"
          }
          key={column.key}
        >
          {column.render(item)}
        </td>
      ))}
    </tr>
  );

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            {columns.map((column) => (
              <th className="p-2" key={column.key}>
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        {groups ? (
          groups.map((group) => (
            <tbody data-model-group={group.key} key={group.key}>
              {group.items.length > 1 ? (
                <tr className="border-b bg-muted/40">
                  {columns.map((column, index) => (
                    <td
                      className={index === 0 ? "p-2 font-semibold" : "p-2"}
                      key={column.key}
                    >
                      {index === 0 ? (
                        <button
                          aria-label={`${expandedGroups.has(group.key) ? "Recolher" : "Expandir"} variantes de ${group.name}`}
                          aria-expanded={expandedGroups.has(group.key)}
                          className="flex items-center gap-2 text-left"
                          onClick={() =>
                            setExpandedGroups((current) => {
                              const next = new Set(current);
                              if (next.has(group.key)) next.delete(group.key);
                              else next.add(group.key);
                              return next;
                            })
                          }
                          type="button"
                        >
                          {expandedGroups.has(group.key) ? (
                            <ChevronDownIcon className="size-4" />
                          ) : (
                            <ChevronRightIcon className="size-4" />
                          )}
                          {group.name}
                          <Badge variant="outline">
                            {group.items.length} variantes
                          </Badge>
                        </button>
                      ) : (
                        column.render(group.representative)
                      )}
                    </td>
                  ))}
                </tr>
              ) : null}
              {group.items.length === 1
                ? group.items.map((item) => renderRow(item))
                : expandedGroups.has(group.key)
                  ? group.items.map((item) => renderRow(item, true))
                  : null}
            </tbody>
          ))
        ) : (
          <tbody>{items.map((item) => renderRow(item))}</tbody>
        )}
      </table>
    </div>
  );
}

export function BenchmarkSection({
  attribution,
  columns,
  groupVariants,
  items,
  onGroupVariantsChange,
  title,
}: {
  attribution?: BenchmarkAttribution;
  columns: BenchmarkColumn[];
  groupVariants: boolean;
  items: BenchmarkTableItem[];
  onGroupVariantsChange: (checked: boolean) => void;
  title: string;
}) {
  if (items.length === 0) return null;

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-4">
        <div className="space-y-1.5">
          <CardTitle className="flex flex-wrap items-center gap-2">
            {title}
            <Badge variant="outline">{items.length}</Badge>
          </CardTitle>
          {attribution ? (
            <a
              className="text-muted-foreground text-sm underline"
              href={attribution.url}
              rel="noreferrer"
              target="_blank"
            >
              {attribution.label}
            </a>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2 text-sm font-medium">
          Agrupar variantes
          <Switch
            aria-label={`Agrupar variantes em ${title}`}
            checked={groupVariants}
            onCheckedChange={onGroupVariantsChange}
          />
        </div>
      </CardHeader>
      <CardContent>
        <BenchmarkTable
          columns={columns}
          groupVariants={groupVariants}
          items={items}
        />
      </CardContent>
    </Card>
  );
}

export function AaSection({
  groupVariants,
  items,
  onGroupVariantsChange,
}: {
  groupVariants: boolean;
  items: ArtificialAnalysisBenchmarkItem[];
  onGroupVariantsChange: (checked: boolean) => void;
}) {
  return (
    <BenchmarkSection
      columns={AA_COLUMNS}
      groupVariants={groupVariants}
      items={toAaTableItems(items)}
      onGroupVariantsChange={onGroupVariantsChange}
      title="Modelos"
    />
  );
}

export function OpenRouterSection({
  groupVariants,
  title,
  items,
  onGroupVariantsChange,
}: {
  groupVariants: boolean;
  title: string;
  items: OpenRouterBenchmarkItem[];
  onGroupVariantsChange: (checked: boolean) => void;
}) {
  return (
    <BenchmarkSection
      attribution={items[0]?.attribution}
      columns={OPENROUTER_COLUMNS}
      groupVariants={groupVariants}
      items={toOpenRouterTableItems(items)}
      onGroupVariantsChange={onGroupVariantsChange}
      title={title}
    />
  );
}
