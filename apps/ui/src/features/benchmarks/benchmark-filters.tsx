import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  type BenchmarkListInput,
  benchmarkListInputSchema,
} from "./contracts/benchmarks";

type Source = "aa" | "openrouter";

export function SnapshotInfo({
  fetchedAt,
  count,
  label,
  url,
  citation,
}: {
  fetchedAt: string;
  count: number;
  label: string;
  url: string;
  citation: string | null;
}) {
  return (
    <p className="text-muted-foreground text-sm">
      {count} resultados · sincronizado em{" "}
      {new Date(fetchedAt).toLocaleString()}. Fonte:{" "}
      <a className="underline" href={url} rel="noreferrer" target="_blank">
        {label}
      </a>
      {citation ? ` · ${citation}` : ""}
    </p>
  );
}

export function BenchmarkFilters({
  search,
  source,
}: {
  search: BenchmarkListInput;
  source: Source;
}) {
  const navigate = useNavigate();
  const apply = (form: HTMLFormElement) => {
    const values = Object.fromEntries(new FormData(form));
    const parsed = benchmarkListInputSchema.parse({
      ...search,
      ...values,
      page: 1,
      minIntelligence: values.minIntelligence || undefined,
      maxPrice: values.maxPrice || undefined,
      subsource: values.subsource || undefined,
    });
    void navigate({
      to: source === "aa" ? "/benchmarks/aa" : "/benchmarks/openrouter",
      search: parsed,
    });
  };
  return (
    <form
      className="grid gap-3 md:grid-cols-3"
      onSubmit={(event) => {
        event.preventDefault();
        apply(event.currentTarget);
      }}
    >
      <Input
        aria-label="Buscar benchmarks"
        defaultValue={search.search}
        name="search"
        placeholder="Buscar modelo"
      />
      <Input
        aria-label="Provider"
        defaultValue={search.provider}
        name="provider"
        placeholder="Provider"
      />
      {source === "aa" ? (
        <>
          <Input
            aria-label="Inteligência mínima"
            defaultValue={search.minIntelligence ?? ""}
            name="minIntelligence"
            placeholder="Inteligência mínima"
            type="number"
          />
          <Input
            aria-label="Preço máximo"
            defaultValue={search.maxPrice ?? ""}
            name="maxPrice"
            placeholder="Preço máximo / 1M"
            type="number"
          />
        </>
      ) : (
        <>
          <select
            aria-label="Subfonte"
            className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
            defaultValue={search.subsource ?? ""}
            name="subsource"
          >
            <option value="">Todas as subfontes</option>
            <option value="artificial-analysis">Artificial Analysis</option>
            <option value="design-arena">Design Arena</option>
          </select>
          <Input
            aria-label="Arena"
            defaultValue={search.arena}
            name="arena"
            placeholder="Arena"
          />
          <Input
            aria-label="Categoria"
            defaultValue={search.category}
            name="category"
            placeholder="Categoria"
          />
        </>
      )}
      <select
        aria-label="Ordenar por"
        className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        defaultValue={search.sort}
        name="sort"
      >
        <option value="intelligence">Inteligência</option>
        <option value="price">Preço</option>
        <option value="name">Nome</option>
        {source === "openrouter" ? (
          <>
            <option value="elo">ELO</option>
            <option value="winRate">Win rate</option>
            <option value="time">Tempo</option>
          </>
        ) : null}
      </select>
      <select
        aria-label="Direção"
        className="h-9 rounded-md border border-input bg-transparent px-3 text-sm"
        defaultValue={search.sortDirection}
        name="sortDirection"
      >
        <option value="desc">Maior primeiro</option>
        <option value="asc">Menor primeiro</option>
      </select>
      <Button type="submit">Aplicar filtros</Button>
    </form>
  );
}

export function BenchmarkPagination({
  search,
  source,
  page,
  pageCount,
}: {
  search: BenchmarkListInput;
  source: Source;
  page: number;
  pageCount: number;
}) {
  const navigate = useNavigate();
  const go = (next: number) =>
    void navigate({
      to: source === "aa" ? "/benchmarks/aa" : "/benchmarks/openrouter",
      search: { ...search, page: next },
    });
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted-foreground text-sm">
        Página {page} de {pageCount}
      </span>
      <div className="flex gap-2">
        <Button
          disabled={page <= 1}
          onClick={() => go(page - 1)}
          type="button"
          variant="outline"
        >
          Anterior
        </Button>
        <Button
          disabled={page >= pageCount}
          onClick={() => go(page + 1)}
          type="button"
          variant="outline"
        >
          Próxima
        </Button>
      </div>
    </div>
  );
}
