import type {
  ArtificialAnalysisBenchmarkItem,
  OpenRouterBenchmarkItem,
} from "@lite-llm/contracts/benchmarks";

export type BenchmarkTableItem = {
  id: string;
  name: string;
  providerId: string | null;
  providerName: string;
  intelligenceIndex: number | null;
  priceInput1mTokens: number | null;
  priceOutput1mTokens: number | null;
  arena: string | null;
  category: string | null;
  elo: number | null;
  winRate: number | null;
  averageTimeSeconds: number | null;
};

export const toAaTableItems = (
  items: ArtificialAnalysisBenchmarkItem[],
): BenchmarkTableItem[] =>
  items.map((item) => ({
    id: item.id,
    name: item.name,
    providerId: item.creatorId,
    providerName: item.creatorName,
    intelligenceIndex: item.intelligenceIndex,
    priceInput1mTokens: item.priceInput1mTokens,
    priceOutput1mTokens: item.priceOutput1mTokens,
    arena: null,
    category: null,
    elo: null,
    winRate: null,
    averageTimeSeconds: null,
  }));

export const toOpenRouterTableItems = (
  items: OpenRouterBenchmarkItem[],
): BenchmarkTableItem[] =>
  items.map((item) => ({
    id: item.id,
    name: item.name,
    providerId: item.provider,
    providerName: item.provider ?? "—",
    intelligenceIndex: item.intelligenceIndex,
    priceInput1mTokens: item.priceInput1mTokens,
    priceOutput1mTokens: item.priceOutput1mTokens,
    arena: item.arena,
    category: item.category,
    elo: item.elo,
    winRate: item.winRate,
    averageTimeSeconds: item.averageTimeSeconds,
  }));

type ModelGroup = {
  key: string;
  name: string;
  items: BenchmarkTableItem[];
  representative: BenchmarkTableItem;
};

function withoutTrailingVariant(name: string): string {
  if (!name.endsWith(")")) return name;
  let depth = 0;
  for (let index = name.length - 1; index >= 0; index -= 1) {
    const character = name[index];
    if (character === ")") depth += 1;
    if (character === "(") {
      depth -= 1;
      if (depth === 0 && name[index - 1] === " ") {
        return name.slice(0, index - 1);
      }
    }
  }
  return name;
}

function modelFamilyName(name: string): string {
  return withoutTrailingVariant(name).replace(
    /\s+(?:distill\b.*|(?:0[1-9]|1[0-2])\d{2}\b.*)$/i,
    "",
  );
}

export function groupModelVariants(items: BenchmarkTableItem[]): ModelGroup[] {
  const groupedItems = new Map<string, Omit<ModelGroup, "representative">>();

  for (const item of items) {
    const name = modelFamilyName(item.name);
    const key = `${item.providerId ?? item.providerName}:${name.toLocaleLowerCase()}`;
    const group = groupedItems.get(key);
    if (group) group.items.push(item);
    else groupedItems.set(key, { key, name, items: [item] });
  }

  return [...groupedItems.values()].map((group) => ({
    ...group,
    representative:
      group.items.find((item) => item.name === group.name) ??
      group.items.find((item) => /\(non-reasoning(?:,|\))/i.test(item.name)) ??
      group.items[0],
  }));
}
