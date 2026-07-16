/** @vitest-environment jsdom */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { AuditListInput } from "./contracts/audit";

const navigate = vi.fn();
let search: AuditListInput = { pageSize: 50 };
const requests = vi.hoisted(() => ({ list: vi.fn(), detail: vi.fn() }));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
  useSearch: () => search,
}));

vi.mock("./query/query-options", () => ({
  auditQueries: {
    detail: ({ id }: { id: string }) => ({
      queryKey: ["audit", "detail", id],
      queryFn: () => requests.detail({ id }),
    }),
    list: (input: unknown) => ({
      queryKey: ["audit", "list", input],
      queryFn: () => requests.list(input),
    }),
  },
}));

import { AuditPage } from "./audit-page";

const id = "1f0d1ca2-77a4-4a28-a891-c0708340a7c1";
const event = {
  id,
  occurredAt: new Date("2026-07-16T12:00:00.000Z"),
  actorType: "user" as const,
  actorId: "admin-1",
  actorRole: "admin" as const,
  source: "ui" as const,
  requestId: "request-1",
  action: "model.update",
  resourceType: "model",
  resourceId: "model-1",
  outcome: "success" as const,
};
const result = {
  events: [event],
  olderCursor: "opaque-older",
  newerCursor: "opaque-newer",
};
type ListResult = {
  events: (typeof event)[];
  olderCursor: string | null;
  newerCursor: string | null;
};

function renderPage(data: ListResult = result) {
  requests.list.mockResolvedValue(data);
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Number.POSITIVE_INFINITY },
    },
  });
  return {
    client,
    ...render(
      <QueryClientProvider client={client}>
        <AuditPage />
      </QueryClientProvider>,
    ),
  };
}

afterEach(() => {
  cleanup();
  navigate.mockClear();
  requests.list.mockReset();
  requests.detail.mockReset();
  search = { pageSize: 50 };
});

describe("AuditPage", () => {
  it("preserva filtros na URL e navega apenas pelos cursores opacos retornados", async () => {
    search = { pageSize: 50, actorId: "admin-1", action: "model.update" };
    renderPage();
    await screen.findByText("model.update");

    fireEvent.change(screen.getByLabelText("Tipo de recurso"), {
      target: { value: "model" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    const filterCall = navigate.mock.calls.at(-1)?.[0];
    expect(filterCall.search(search)).toEqual({
      pageSize: 50,
      actorId: "admin-1",
      action: "model.update",
      resourceType: "model",
      cursor: undefined,
      direction: undefined,
    });

    fireEvent.click(screen.getByRole("button", { name: "Mais antigos" }));
    const olderCall = navigate.mock.calls.at(-1)?.[0];
    expect(olderCall.search(search)).toEqual({
      ...search,
      cursor: "opaque-older",
      direction: "older",
    });
    fireEvent.click(screen.getByRole("button", { name: "Mais recentes" }));
    const newerCall = navigate.mock.calls.at(-1)?.[0];
    expect(newerCall.search(search)).toEqual({
      ...search,
      cursor: "opaque-newer",
      direction: "newer",
    });
  });

  it("distingue auditoria vazia de filtros sem resultados", async () => {
    renderPage({ events: [], olderCursor: null, newerCursor: null });
    expect(
      await screen.findByText("Ainda não há eventos de auditoria."),
    ).toBeTruthy();
    cleanup();
    search = { pageSize: 50, outcome: "failure" };
    renderPage({ events: [], olderCursor: null, newerCursor: null });
    expect(
      await screen.findByText("Nenhum evento corresponde aos filtros."),
    ).toBeTruthy();
  });

  it("mostra erro recuperável sem renderizar o erro bruto e permite tentar novamente", async () => {
    requests.list
      .mockRejectedValueOnce(new Error("Bearer audit-token-should-not-persist"))
      .mockResolvedValueOnce(result);
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={client}>
        <AuditPage />
      </QueryClientProvider>,
    );
    expect(
      await screen.findByText("Não foi possível carregar a auditoria"),
    ).toBeTruthy();
    expect(document.body.textContent).not.toContain(
      "audit-token-should-not-persist",
    );
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    expect(await screen.findByText("model.update")).toBeTruthy();
  });

  it("busca detalhes somente após seleção, mantém leitura e redige sentinelas", async () => {
    const detail = {
      ok: true,
      data: {
        ...event,
        before: {
          email: "ada@example.test",
          authorization: "Bearer audit-token-should-not-persist",
        },
        after: { enabled: true },
        metadata: {
          cookie: "audit-cookie-should-not-persist",
          note: "mudança aprovada",
        },
      },
    };
    requests.detail.mockReturnValue(detail.data);
    const unsafeList = { ...event, before: "audit-secret-should-not-persist" };
    renderPage({ events: [unsafeList], olderCursor: null, newerCursor: null });
    await screen.findByText("model.update");
    expect(requests.detail).not.toHaveBeenCalled();
    expect(document.body.textContent).not.toContain(
      "audit-secret-should-not-persist",
    );
    fireEvent.click(screen.getByRole("button", { name: /model.update/i }));
    await waitFor(() => expect(requests.detail).toHaveBeenCalledWith({ id }));
    expect(detail.data.before.authorization).toContain("Bearer");
    expect(detail.data.metadata.cookie).toContain("audit-cookie");
    expect(
      screen.queryByRole("button", { name: /editar|remover|exportar/i }),
    ).toBeNull();
  });

  it("mantém layout responsivo sem tabelas fixas", async () => {
    const { container } = renderPage();
    await screen.findByText("model.update");
    expect(container.querySelector("table")).toBeNull();
    expect(
      container.querySelector(
        ".lg\\:grid-cols-\\[minmax\\(0\\,1fr\\)_minmax\\(20rem\\,0\\.7fr\\)\\]",
      ),
    ).toBeTruthy();
  });
});
