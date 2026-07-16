import { useQuery } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { PageContent } from "@/features/app-shell/components/page-content";
import { PageHeader } from "@/features/app-shell/components/page-header";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/shared/components/ui/alert";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import { Spinner } from "@/shared/components/ui/spinner";
import type { AuditListInput } from "./contracts/audit";
import { auditQueries } from "./query/query-options";

type FilterKey =
  | "start"
  | "end"
  | "actorId"
  | "action"
  | "resourceType"
  | "outcome";

const filterKeys: readonly FilterKey[] = [
  "start",
  "end",
  "actorId",
  "action",
  "resourceType",
  "outcome",
];

function asFilter(value: FormDataEntryValue | null): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}

function safeProjection(value: unknown): string {
  const sensitiveKey =
    /authorization|cookie|header|session|token|secret|password|apikey|keyhash|fingerprint|email|name|ip|useragent/u;
  const sensitiveValue =
    /bearer\s+|@|\b(?:\d{1,3}\.){3}\d{1,3}\b|should-not-persist|cookie|session|authorization|x-api-key/u;
  const project = (input: unknown, key = ""): unknown => {
    if (sensitiveKey.test(key)) return "[REDACTED]";
    if (typeof input === "string")
      return sensitiveValue.test(input) ? "[REDACTED]" : input;
    if (Array.isArray(input)) return input.map((item) => project(item));
    if (input && typeof input === "object")
      return Object.fromEntries(
        Object.entries(input).map(([entryKey, entryValue]) => [
          entryKey,
          project(entryValue, entryKey),
        ]),
      );
    return input;
  };
  return JSON.stringify(project(value), null, 2);
}

function formatOccurredAt(value: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  }).format(value);
}

export function AuditPage() {
  const search = useSearch({ from: "/_protected/audit" }) as AuditListInput;
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string>();
  const listQuery = useQuery(auditQueries.list(search));
  const detailQuery = useQuery({
    ...auditQueries.detail({
      id: selectedId ?? "00000000-0000-4000-8000-000000000000",
    }),
    enabled: Boolean(selectedId),
  });

  const updateSearch = (next: Partial<AuditListInput>) =>
    navigate({
      to: "/audit",
      search: (previous) => ({ ...previous, ...next }),
    });

  const applyFilters = (form: HTMLFormElement) => {
    const values = new FormData(form);
    const filters = Object.fromEntries(
      filterKeys.map((key) => [key, asFilter(values.get(key))]),
    ) as Partial<AuditListInput>;
    setSelectedId(undefined);
    updateSearch({ ...filters, cursor: undefined, direction: undefined });
  };

  const clearFilters = () => {
    setSelectedId(undefined);
    updateSearch({
      start: undefined,
      end: undefined,
      actorId: undefined,
      action: undefined,
      resourceType: undefined,
      outcome: undefined,
      cursor: undefined,
      direction: undefined,
    });
  };

  const hasFilters = filterKeys.some((key) => search[key] !== undefined);

  return (
    <PageContent className="space-y-6">
      <PageHeader
        title="Auditoria"
        subtitle="Registro somente leitura de alterações administrativas."
        actions={<Badge variant="secondary">Somente leitura</Badge>}
      />
      <Card>
        <CardContent className="pt-6">
          <form
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
            onSubmit={(event) => {
              event.preventDefault();
              applyFilters(event.currentTarget);
            }}
          >
            <Input
              aria-label="Início"
              defaultValue={search.start}
              name="start"
              placeholder="Início ISO 8601"
            />
            <Input
              aria-label="Fim"
              defaultValue={search.end}
              name="end"
              placeholder="Fim ISO 8601"
            />
            <Input
              aria-label="ID do ator"
              defaultValue={search.actorId}
              name="actorId"
              placeholder="ID do ator"
            />
            <Input
              aria-label="Ação"
              defaultValue={search.action}
              name="action"
              placeholder="Ação exata"
            />
            <Input
              aria-label="Tipo de recurso"
              defaultValue={search.resourceType}
              name="resourceType"
              placeholder="Tipo de recurso"
            />
            <label
              className="grid gap-1 text-sm font-medium"
              htmlFor="audit-outcome"
            >
              Resultado
              <select
                className="h-9 rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                defaultValue={search.outcome ?? ""}
                id="audit-outcome"
                name="outcome"
              >
                <option value="">Todos</option>
                <option value="success">Sucesso</option>
                <option value="failure">Falha</option>
                <option value="denied">Negado</option>
              </select>
            </label>
            <div className="flex flex-wrap gap-2 sm:col-span-2 xl:col-span-3">
              <Button type="submit">Aplicar filtros</Button>
              <Button onClick={clearFilters} type="button" variant="outline">
                Limpar filtros
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {listQuery.isPending ? (
        <section aria-busy="true" className="flex items-center gap-2">
          <Spinner aria-label="Carregando auditoria" /> Carregando eventos…
        </section>
      ) : null}
      {listQuery.isError ? (
        <section className="space-y-3">
          <Alert variant="destructive">
            <AlertTitle>Não foi possível carregar a auditoria</AlertTitle>
            <AlertDescription>
              Tente novamente. Seus filtros foram preservados.
            </AlertDescription>
          </Alert>
          <Button onClick={() => void listQuery.refetch()} type="button">
            Tentar novamente
          </Button>
        </section>
      ) : null}
      {listQuery.data ? (
        <section
          aria-label="Eventos de auditoria"
          className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.7fr)]"
        >
          <Card>
            <CardHeader>
              <CardTitle>Eventos</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {listQuery.data.events.length === 0 ? (
                <p className="text-muted-foreground">
                  {hasFilters
                    ? "Nenhum evento corresponde aos filtros."
                    : "Ainda não há eventos de auditoria."}
                </p>
              ) : (
                <ul className="space-y-2">
                  {listQuery.data.events.map((event) => (
                    <li key={event.id}>
                      <Button
                        aria-pressed={selectedId === event.id}
                        className="h-auto w-full justify-start whitespace-normal py-3 text-left"
                        onClick={() => setSelectedId(event.id)}
                        type="button"
                        variant={
                          selectedId === event.id ? "secondary" : "outline"
                        }
                      >
                        <span className="grid gap-1">
                          <span className="font-medium">{event.action}</span>
                          <span className="text-muted-foreground text-xs">
                            {event.resourceType} · {event.outcome} ·{" "}
                            {formatOccurredAt(event.occurredAt)}
                          </span>
                        </span>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex flex-wrap justify-between gap-2 pt-2">
                <Button
                  disabled={!listQuery.data.newerCursor}
                  onClick={() =>
                    updateSearch({
                      cursor: listQuery.data?.newerCursor ?? undefined,
                      direction: "newer",
                    })
                  }
                  type="button"
                  variant="outline"
                >
                  Mais recentes
                </Button>
                <Button
                  disabled={!listQuery.data.olderCursor}
                  onClick={() =>
                    updateSearch({
                      cursor: listQuery.data?.olderCursor ?? undefined,
                      direction: "older",
                    })
                  }
                  type="button"
                  variant="outline"
                >
                  Mais antigos
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Detalhe redigido</CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedId ? (
                <p className="text-muted-foreground">
                  Selecione um evento para ver o detalhe.
                </p>
              ) : null}
              {selectedId && detailQuery.isPending ? (
                <p aria-busy="true">Carregando detalhe…</p>
              ) : null}
              {selectedId && detailQuery.isError ? (
                <Alert variant="destructive">
                  <AlertTitle>Não foi possível carregar o detalhe</AlertTitle>
                  <AlertDescription>
                    Tente selecionar o evento novamente.
                  </AlertDescription>
                </Alert>
              ) : null}
              {detailQuery.data ? (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {detailQuery.data.action} · {detailQuery.data.resourceType}{" "}
                    · {detailQuery.data.outcome}
                  </p>
                  <section aria-label="Antes">
                    <h2 className="font-medium">Antes</h2>
                    <pre className="overflow-auto rounded-md bg-muted p-3 text-xs">
                      {safeProjection(detailQuery.data.before)}
                    </pre>
                  </section>
                  <section aria-label="Depois">
                    <h2 className="font-medium">Depois</h2>
                    <pre className="overflow-auto rounded-md bg-muted p-3 text-xs">
                      {safeProjection(detailQuery.data.after)}
                    </pre>
                  </section>
                  <section aria-label="Metadados">
                    <h2 className="font-medium">Metadados</h2>
                    <pre className="overflow-auto rounded-md bg-muted p-3 text-xs">
                      {safeProjection(detailQuery.data.metadata)}
                    </pre>
                  </section>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </section>
      ) : null}
    </PageContent>
  );
}
