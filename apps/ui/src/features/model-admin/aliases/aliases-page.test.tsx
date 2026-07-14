/** @vitest-environment jsdom */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { updateAlias } from "../server/model-admin.functions";
import { AliasesPage } from "./aliases-page";

vi.mock("@/features/model-admin/server/model-admin.functions", () => ({
  deleteAlias: vi.fn(),
  listAliases: vi.fn(),
  listModels: vi.fn(),
  updateAlias: vi.fn(),
}));

const id = "9d7bfe5c-b35f-49b9-8dfc-4cc22c387d73";
const targetId = "33f15b8b-7aef-455d-a10c-bcf78fe3926b";

function renderPage(role: "admin" | "viewer" = "admin") {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Number.POSITIVE_INFINITY },
    },
  });
  queryClient.setQueryData(
    ["model-admin", "aliases", "list"],
    [
      {
        id,
        alias: "gpt-5-latest",
        aliasNormalized: "gpt-5-latest",
        targetModelId: targetId,
        revision: 3,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  );
  queryClient.setQueryData(
    ["model-admin", "models", "list"],
    [
      {
        id: targetId,
        providerId: "ed652f71-4679-42ad-b06e-955f0b0ea5ef",
        providerName: "OpenAI",
        modelId: "gpt-5.6-luna",
        enabled: true,
        revision: 2,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  );
  return render(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(AliasesPage, { role }),
    ),
  );
}

afterEach(cleanup);

describe("AliasesPage", () => {
  it("exibe alias normalizado, UUID do target e o modelo/provider legível", () => {
    renderPage();

    expect(screen.getByText("gpt-5-latest")).toBeTruthy();
    expect(screen.getByText(targetId)).toBeTruthy();
    expect(screen.getByText("OpenAI / gpt-5.6-luna")).toBeTruthy();
  });

  it("filtra aliases e não disponibiliza controles mutáveis ao viewer", () => {
    renderPage("viewer");

    fireEvent.change(screen.getByLabelText("Filter aliases"), {
      target: { value: "missing" },
    });
    expect(screen.getByText("No aliases match this filter.")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Edit alias" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Delete alias" })).toBeNull();
  });

  it("abre o formulário RHF/Zod para retarget com a revisão do alias", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Edit alias" }));
    expect((screen.getByLabelText("Alias") as HTMLInputElement).value).toBe(
      "gpt-5-latest",
    );
    expect(
      (screen.getByLabelText("Target model") as HTMLSelectElement).value,
    ).toBe(targetId);
    expect(screen.getAllByText("Normalized: gpt-5-latest")).toHaveLength(2);
  });

  it("mostra somente o feedback público para uma revisão stale", async () => {
    vi.mocked(updateAlias).mockResolvedValueOnce({
      ok: false,
      error: {
        code: "CONFLICT",
        message: "Alias was changed by another request",
        retryable: false,
        currentRevision: 4,
      },
    });
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Edit alias" }));
    fireEvent.click(screen.getByRole("button", { name: "Save alias" }));

    await waitFor(() => {
      expect(
        screen.getByText("Alias was changed by another request"),
      ).toBeTruthy();
    });
  });

  it("pede confirmação antes de remover um alias", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Delete alias" }));
    expect(
      screen.getByText("This will permanently delete gpt-5-latest."),
    ).toBeTruthy();
  });
});
