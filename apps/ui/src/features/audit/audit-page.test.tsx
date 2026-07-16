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

function renderPage(data: ListResult = result, detail?: unknown) {
  requests.list.mockResolvedValue(data);
  return renderWithClient(detail);
}

function renderWithClient(detail?: unknown) {
  const client = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Number.POSITIVE_INFINITY },
    },
  });
  if (detail !== undefined) {
    client.setQueryData(["audit", "detail", id], detail);
  }
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
  it("refaz a listagem para URL limpa e histórico, refletindo cursores retornados", async () => {
    const initialSearch: AuditListInput = {
      pageSize: 50,
      actorId: "admin-1",
      action: "model.update",
    };
    const cleanSearch: AuditListInput = { pageSize: 50 };
    const historySearch: AuditListInput = {
      pageSize: 50,
      action: "provider.create",
      cursor: "opaque-history-cursor",
      direction: "older",
    };
    const initialResult: ListResult = {
      events: [event],
      olderCursor: "opaque-initial-older",
      newerCursor: "opaque-initial-newer",
    };
    const historyResult: ListResult = {
      events: [{ ...event, action: "provider.create" }],
      olderCursor: "opaque-response-older",
      newerCursor: "opaque-response-newer",
    };
    requests.list.mockImplementation((input: AuditListInput) => {
      if (input === initialSearch) return Promise.resolve(initialResult);
      if (input === cleanSearch) {
        return Promise.resolve({
          events: [],
          olderCursor: null,
          newerCursor: null,
        });
      }
      if (input === historySearch) return Promise.resolve(historyResult);
      throw new Error("Unexpected audit search input");
    });

    search = initialSearch;
    const page = renderWithClient();
    expect(await screen.findByText("model.update")).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Limpar filtros" }));
    const clearCall = navigate.mock.calls.at(-1)?.[0];
    expect(clearCall.search(initialSearch)).toMatchObject({
      actorId: undefined,
      action: undefined,
      cursor: undefined,
      direction: undefined,
    });

    search = cleanSearch;
    page.rerender(
      <QueryClientProvider client={page.client}>
        <AuditPage />
      </QueryClientProvider>,
    );
    await waitFor(() =>
      expect(requests.list).toHaveBeenLastCalledWith(cleanSearch),
    );
    expect(
      await screen.findByText("Ainda não há eventos de auditoria."),
    ).toBeTruthy();
    expect((screen.getByLabelText("Ação") as HTMLInputElement).value).toBe("");
    expect(
      (screen.getByLabelText("ID do ator") as HTMLInputElement).value,
    ).toBe("");
    expect(
      (
        screen.getByRole("button", {
          name: "Mais antigos",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(
      (
        screen.getByRole("button", {
          name: "Mais recentes",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);

    search = historySearch;
    page.rerender(
      <QueryClientProvider client={page.client}>
        <AuditPage />
      </QueryClientProvider>,
    );
    await waitFor(() =>
      expect(requests.list).toHaveBeenLastCalledWith(historySearch),
    );
    expect(await screen.findByText("provider.create")).toBeTruthy();
    expect((screen.getByLabelText("Ação") as HTMLInputElement).value).toBe(
      "provider.create",
    );
    expect(
      (
        screen.getByRole("button", {
          name: "Mais antigos",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false);
    expect(
      (
        screen.getByRole("button", {
          name: "Mais recentes",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(false);

    fireEvent.click(screen.getByRole("button", { name: "Mais antigos" }));
    const olderCall = navigate.mock.calls.at(-1)?.[0];
    expect(olderCall.search(historySearch)).toEqual({
      ...historySearch,
      cursor: "opaque-response-older",
      direction: "older",
    });
    fireEvent.click(screen.getByRole("button", { name: "Mais recentes" }));
    const newerCall = navigate.mock.calls.at(-1)?.[0];
    expect(newerCall.search(historySearch)).toEqual({
      ...historySearch,
      cursor: "opaque-response-newer",
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

  it("renderiza detalhe redigido somente após seleção e sem sentinelas no DOM", async () => {
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
    requests.detail.mockResolvedValue(detail.data);
    const unsafeList = { ...event, before: "audit-secret-should-not-persist" };
    renderPage(
      { events: [unsafeList], olderCursor: null, newerCursor: null },
      detail.data,
    );
    await screen.findByText("model.update");
    expect(requests.detail).not.toHaveBeenCalled();
    expect(document.body.textContent).not.toContain(
      "audit-secret-should-not-persist",
    );
    fireEvent.click(screen.getByRole("button", { name: /model.update/i }));
    expect(screen.getByText("Detalhe redigido")).toBeTruthy();
    expect(screen.getByLabelText("Metadados")).toBeTruthy();
    expect(document.body.textContent).not.toContain("ada@example.test");
    expect(document.body.textContent).not.toContain(
      "audit-token-should-not-persist",
    );
    expect(document.body.textContent).not.toContain(
      "audit-cookie-should-not-persist",
    );
    expect(
      screen.queryByRole("button", { name: /editar|remover|exportar/i }),
    ).toBeNull();
  });

  it("permite tentar novamente o detalhe sem expor o erro bruto", async () => {
    requests.detail
      .mockRejectedValueOnce(
        new Error("Bearer detail-token-should-not-persist"),
      )
      .mockResolvedValueOnce({
        ...event,
        before: null,
        after: null,
        metadata: null,
      });
    renderPage({ events: [event], olderCursor: null, newerCursor: null });
    await screen.findByText("model.update");
    fireEvent.click(screen.getByRole("button", { name: /model.update/i }));
    expect(
      await screen.findByText("Não foi possível carregar o detalhe"),
    ).toBeTruthy();
    expect(document.body.textContent).not.toContain(
      "detail-token-should-not-persist",
    );
    fireEvent.click(screen.getByRole("button", { name: "Tentar novamente" }));
    await waitFor(() => expect(requests.detail).toHaveBeenCalledTimes(2));
    expect(requests.detail).toHaveBeenNthCalledWith(1, { id });
    expect(requests.detail).toHaveBeenNthCalledWith(2, { id });
    expect(await screen.findByLabelText("Metadados")).toBeTruthy();
    expect(document.body.textContent).not.toContain(
      "detail-token-should-not-persist",
    );
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
