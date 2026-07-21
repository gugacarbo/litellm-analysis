import type {
  ArtificialAnalysisBenchmarkItem,
  OpenRouterBenchmarkItem,
} from "@lite-llm/contracts/benchmarks";
import { Badge } from "@/shared/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

const currency = (value: number | null) =>
  value === null ? "—" : `$${value.toFixed(2)}`;
const metric = (value: number | null, digits = 1) =>
  value === null ? "—" : value.toFixed(digits);

export function AaTable({
  items,
}: {
  items: ArtificialAnalysisBenchmarkItem[];
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="p-2">Modelo</th>
            <th className="p-2">Provider</th>
            <th className="p-2">Inteligência</th>
            <th className="p-2">Input / 1M</th>
            <th className="p-2">Output / 1M</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr className="border-b" key={item.id}>
              <td className="p-2 font-medium">{item.name}</td>
              <td className="p-2">{item.creatorName}</td>
              <td className="p-2">{metric(item.intelligenceIndex)}</td>
              <td className="p-2">{currency(item.priceInput1mTokens)}</td>
              <td className="p-2">{currency(item.priceOutput1mTokens)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function OpenRouterSection({
  title,
  items,
}: {
  title: string;
  items: OpenRouterBenchmarkItem[];
}) {
  if (items.length === 0) return null;
  const attribution = items[0]?.attribution;
  return (
    <Card>
      <CardHeader>
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
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2">Modelo</th>
                <th className="p-2">Provider</th>
                <th className="p-2">Arena / categoria</th>
                <th className="p-2">ELO</th>
                <th className="p-2">Win rate</th>
                <th className="p-2">Tempo</th>
                <th className="p-2">Índice AA</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr className="border-b" key={item.id}>
                  <td className="p-2 font-medium">{item.name}</td>
                  <td className="p-2">{item.provider ?? "—"}</td>
                  <td className="p-2">
                    {[item.arena, item.category].filter(Boolean).join(" / ") ||
                      "—"}
                  </td>
                  <td className="p-2">{metric(item.elo, 0)}</td>
                  <td className="p-2">{metric(item.winRate)}%</td>
                  <td className="p-2">{metric(item.averageTimeSeconds)}s</td>
                  <td className="p-2">{metric(item.intelligenceIndex)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
