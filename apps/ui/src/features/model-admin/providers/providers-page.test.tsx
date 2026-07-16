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

vi.mock("@/features/model-admin/server/model-admin.functions", () => ({
  applyDiscoverySelection: vi.fn(),
  createProvider: vi.fn(),
  deleteProvider: vi.fn(),
  discoverModels: vi.fn(),
  getProvider: vi.fn(),
  listProviders: vi.fn(),
  probeModel: vi.fn(),
  setDefaultProvider: vi.fn(),
  testProviderConnection: vi.fn(),
  updateProvider: vi.fn(),
}));

import {
  createProvider,
  listProviders,
  testProviderConnection,
} from "@/features/model-admin/server/model-admin.functions";
import { ProvidersPage } from "./providers-page";

const id = "ed652f71-4679-42ad-b06e-955f0b0ea5ef";
const provider = {
  id,
  name: "OpenAI",
  provider: "openai-compatible",
  baseUrl: "https://api.openai.com/v1",
  isDefault: true,
  hasStoredSecret: true,
  credentialStatus: "configured" as const,
  modelCount: 2,
  revision: 4,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function renderPage(role: "admin" | "viewer" = "admin") {
  vi.mocked(listProviders).mockResolvedValue({ ok: true, data: [provider] });
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Number.POSITIVE_INFINITY },
    },
  });
  queryClient.setQueryData(["model-admin", "providers", "list"], [provider]);
  return render(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(ProvidersPage, { role }),
    ),
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ProvidersPage", () => {
  it("renderiza somente o DTO público e a presença da credencial", () => {
    const { container } = renderPage();

    expect(screen.getByText("OpenAI")).toBeTruthy();
    expect(screen.getByText("Configurada")).toBeTruthy();
    expect(screen.getByText("2")).toBeTruthy();
    expect(
      screen
        .getByRole("link", { name: "Abrir provider OpenAI" })
        .getAttribute("href"),
    ).toBe(`/providers/${id}`);
    expect(container.textContent).not.toContain("super-secret-value");
    expect(container.textContent).not.toContain("ciphertext");
  });

  it("mantém viewer em modo somente leitura", () => {
    renderPage("viewer");

    expect(screen.getByText("Somente leitura")).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Salvar provider" }),
    ).toBeNull();
    expect(screen.queryByRole("button", { name: "Remover" })).toBeNull();
    expect(
      screen.getByRole("link", { name: "Abrir provider OpenAI" }),
    ).toBeTruthy();
  });

  it("envia replace explicitamente e limpa o campo após salvar", async () => {
    vi.mocked(createProvider).mockResolvedValue({
      ok: true,
      data: { ...provider, id: "6dd86a67-2176-43cc-b895-7e1d06e88c56" },
    });
    renderPage();

    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Novo provider" }));
    expect(screen.getByRole("dialog")).toBeTruthy();

    const nameInput = screen.getByLabelText("Nome") as HTMLInputElement;
    fireEvent.change(nameInput, { target: { value: "Novo" } });
    fireEvent.click(screen.getByRole("combobox", { name: "Adapter" }));
    fireEvent.click(
      await screen.findByRole("option", { name: "OpenAI-compatible" }),
    );
    const credentialInput = (await screen.findByLabelText(
      "Nova credencial",
    )) as HTMLInputElement;
    fireEvent.change(credentialInput, {
      target: { value: "super-secret-value" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Salvar provider" }));

    await waitFor(() =>
      expect(createProvider).toHaveBeenCalledWith({
        data: {
          name: "Novo",
          provider: "openai-compatible",
          baseUrl: null,
          credential: { kind: "replace", value: "super-secret-value" },
        },
      }),
    );
    await waitFor(() => expect(credentialInput.value).toBe(""));
  });

  it("testa a conexão de um novo provider sem salvá-lo", async () => {
    vi.mocked(testProviderConnection).mockResolvedValue({
      ok: true,
      data: { message: "Connection successful." },
    });
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Novo provider" }));
    fireEvent.click(screen.getByRole("combobox", { name: "Adapter" }));
    fireEvent.click(
      await screen.findByRole("option", { name: "OpenAI-compatible" }),
    );
    fireEvent.change(screen.getByLabelText("Base URL"), {
      target: { value: "https://api.example.test/v1" },
    });
    fireEvent.change(await screen.findByLabelText("Nova credencial"), {
      target: { value: "connection-secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Testar conexão" }));

    await waitFor(() =>
      expect(testProviderConnection).toHaveBeenCalledWith({
        data: {
          provider: "openai-compatible",
          baseUrl: "https://api.example.test/v1",
          credential: "connection-secret",
        },
      }),
    );
    expect(createProvider).not.toHaveBeenCalled();
    expect((await screen.findByRole("status")).textContent).toContain(
      "Connection successful.",
    );
  });
});
