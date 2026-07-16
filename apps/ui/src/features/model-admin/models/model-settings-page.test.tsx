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
  deleteModel: vi.fn(),
  getModel: vi.fn(),
  listProviders: vi.fn(),
  saveModel: vi.fn(),
  toggleModel: vi.fn(),
}));

import {
  getModel,
  listProviders,
  saveModel,
} from "@/features/model-admin/server/model-admin.functions";
import { ModelSettingsPage } from "./model-settings-page";

const modelId = "f8c83fac-1177-4ca1-a48e-631b445b0cc9";
const providerId = "cf265589-a42b-4110-97d3-f7c526b63d3c";
const alternateProviderId = "f9d93fd7-f4eb-4fac-b1e3-7852b5b5b1fd";
const model = {
  id: modelId,
  providerId,
  providerName: "Platon 2",
  modelId: "minimax-m3",
  displayName: "MiniMax M3",
  enabled: true,
  revision: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  family: "MiniMax",
  description: "A reasoning model.",
  contextLength: 131_072,
  maxCompletionTokens: 16_384,
  knowledgeCutoff: null,
  expirationDate: null,
  architecture: {
    inputModalities: ["text" as const],
    outputModalities: ["text" as const],
    tokenizer: "MiniMax",
    instructType: "chat",
  },
  reasoning: {
    effort: "high" as const,
    maxTokens: 4_096,
    supportsToolUse: true,
    supportsComputerUse: false,
  },
  supportedParameters: ["temperature" as const, "max_tokens" as const],
  defaultParameters: { temperature: 0.7, stop: ["END"] },
  perRequestLimits: { maxInputTokens: 100_000, rpm: 60 },
  pricing: { input: 0.2, output: 0.8 },
  requestOptions: {
    timeoutMs: 30_000,
    maxRetries: 2,
    headers: { "x-client": "models" },
  },
  reasoningApiId: null,
  aliases: [],
};
const providers = [
  {
    id: providerId,
    name: "Platon 2",
    provider: "openai-compatible",
    baseUrl: "https://api.platon.example/v1",
    isDefault: true,
    hasStoredSecret: true,
    credentialStatus: "configured" as const,
    modelCount: 1,
    revision: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: alternateProviderId,
    name: "Backup provider",
    provider: "openai-compatible",
    baseUrl: "https://api.backup.example/v1",
    isDefault: false,
    hasStoredSecret: true,
    credentialStatus: "configured" as const,
    modelCount: 0,
    revision: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

function renderPage(role: "admin" | "viewer" = "admin") {
  vi.mocked(getModel).mockResolvedValue({ ok: true, data: model });
  vi.mocked(listProviders).mockResolvedValue({ ok: true, data: providers });
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Number.POSITIVE_INFINITY },
    },
  });
  queryClient.setQueryData(["model-admin", "models", "detail", modelId], model);
  queryClient.setQueryData(["model-admin", "providers", "list"], providers);
  return render(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(ModelSettingsPage, { modelId, role }),
    ),
  );
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ModelSettingsPage", () => {
  it("permite ao admin trocar o provider do modelo", async () => {
    vi.mocked(saveModel).mockResolvedValue({ ok: true, data: model });
    renderPage();

    const provider = await screen.findByRole("combobox", {
      name: "Provider",
    });
    expect((provider as HTMLButtonElement).disabled).toBe(false);
    await screen.findByRole("textbox", { name: "Model ID" });
    expect(
      screen
        .getByRole("button", { name: "Save settings" })
        .getAttribute("form"),
    ).toBe("model-settings-form");
    expect(
      screen
        .getByRole("switch", { name: "Model enabled" })
        .getAttribute("aria-checked"),
    ).toBe("true");
    expect(screen.queryByText("Model management")).toBeNull();

    fireEvent.click(provider);
    const alternateProvider = await screen.findByRole("option", {
      name: "Backup provider",
    });
    fireEvent.pointerDown(alternateProvider);
    fireEvent.pointerUp(alternateProvider);
    fireEvent.click(alternateProvider);
    await waitFor(() =>
      expect(provider.textContent).toContain("Backup provider"),
    );
    fireEvent.click(screen.getByRole("button", { name: "Save settings" }));

    await waitFor(() =>
      expect(saveModel).toHaveBeenCalledWith({
        data: expect.objectContaining({ providerId: alternateProviderId }),
      }),
    );
  });

  it("mantém o provider somente leitura para viewer", async () => {
    renderPage("viewer");

    const provider = await screen.findByLabelText("Provider");
    expect((provider as HTMLInputElement).disabled).toBe(true);
    expect(screen.queryByRole("button", { name: "Save settings" })).toBeNull();
    expect(screen.queryByText("Model management")).toBeNull();
    expect(screen.queryByRole("button", { name: "Disable model" })).toBeNull();
    expect(screen.queryByRole("switch", { name: "Model enabled" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Delete model" })).toBeNull();
  });

  it("mostra três abas com Essencial ativa por padrão", async () => {
    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Platon 2/MiniMax M3" }),
    ).toBeTruthy();
    expect(screen.getAllByText("platon-2/minimax-m3")).toHaveLength(2);
    expect(
      screen.getByRole("button", { name: "Copy usable model ID" }),
    ).toBeTruthy();
    expect(screen.getByText(modelId)).toBeTruthy();
    expect(
      screen.getByRole("button", { name: "Copy model UUID" }),
    ).toBeTruthy();
    expect(screen.queryByText("Revision 1")).toBeNull();
    expect(
      (await screen.findByRole("tab", { name: "Essencial" })).getAttribute(
        "aria-selected",
      ),
    ).toBe("true");
    expect(
      screen
        .getByRole("tab", { name: "Capacidades" })
        .getAttribute("aria-selected"),
    ).toBe("false");
    expect(
      screen
        .getByRole("tab", { name: "Aliases" })
        .getAttribute("aria-selected"),
    ).toBe("false");
    expect(screen.queryByRole("tab", { name: "Execução e preço" })).toBeNull();
    expect(
      (
        await screen.findByRole("textbox", {
          name: "Model ID",
        })
      ).getAttribute("value"),
    ).toBe("minimax-m3");
  });

  it("abre as seções avançadas por padrão e permite várias abertas", async () => {
    const { container } = renderPage();

    fireEvent.click(await screen.findByRole("tab", { name: "Capacidades" }));
    for (const section of [
      "Architecture",
      "Reasoning",
      "Per-request limits",
      "Parameters",
    ]) {
      expect(screen.getByRole("button", { name: section })).toBeTruthy();
    }
    const triggers = Array.from(
      container.querySelectorAll('[data-slot="accordion-trigger"]'),
    ).map((trigger) => trigger.textContent);
    expect(triggers.indexOf("Per-request limits")).toBeLessThan(
      triggers.indexOf("Parameters"),
    );
    expect(
      await screen.findByRole("combobox", { name: "Tokenizer" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("combobox", { name: "Instruct type" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("spinbutton", { name: "Max reasoning tokens" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("combobox", { name: "Supports tool use" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("combobox", { name: "Supports computer use" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("spinbutton", { name: "Timeout (ms)" }),
    ).toBeTruthy();
    expect(
      screen.getByRole("textbox", { name: "Reasoning API model ID" }),
    ).toBeTruthy();
    expect(
      screen.queryByRole("button", { name: "Request options" }),
    ).toBeNull();
    expect(
      screen.queryByRole("button", { name: "Reasoning API model ID" }),
    ).toBeNull();
    expect(screen.queryByText("Supports vision")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Architecture" }));
    expect(screen.queryByRole("combobox", { name: "Tokenizer" })).toBeNull();
    expect(
      screen.queryByRole("combobox", { name: "Supports tool use" }),
    ).toBeNull();
    expect(
      screen.queryByRole("combobox", { name: "Supports computer use" }),
    ).toBeNull();
    expect(
      screen.getByRole("spinbutton", { name: "Max reasoning tokens" }),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("tab", { name: "Essencial" }));
    expect(
      await screen.findByRole("spinbutton", { name: "Input price" }),
    ).toBeTruthy();
    expect(screen.queryByRole("combobox", { name: "Tokenizer" })).toBeNull();
    expect(container.querySelector("#advanced-configuration")).toBeNull();
  });

  it("preserva uma edição essencial ao navegar entre abas e salvar", async () => {
    vi.mocked(saveModel).mockResolvedValue({ ok: true, data: model });
    renderPage();

    const displayName = (await screen.findByRole("textbox", {
      name: "Display name",
    })) as HTMLInputElement;
    const saveSettings = screen.getByRole("button", {
      name: "Save settings",
    }) as HTMLButtonElement;
    expect(saveSettings.disabled).toBe(true);
    fireEvent.change(displayName, { target: { value: "MiniMax M3 updated" } });
    expect(saveSettings.disabled).toBe(false);
    fireEvent.click(screen.getByRole("tab", { name: "Capacidades" }));
    fireEvent.click(screen.getByRole("tab", { name: "Essencial" }));

    expect(
      (
        await screen.findByRole("textbox", { name: "Display name" })
      ).getAttribute("value"),
    ).toBe("MiniMax M3 updated");
    fireEvent.click(saveSettings);

    await waitFor(() =>
      expect(saveModel).toHaveBeenCalledWith({
        data: expect.objectContaining({ displayName: "MiniMax M3 updated" }),
      }),
    );
  });

  it("edita aliases individualmente e preserva o payload do modelo", async () => {
    vi.mocked(saveModel).mockResolvedValue({ ok: true, data: model });
    renderPage();

    expect(screen.queryByRole("textbox", { name: "New alias" })).toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: "Aliases" }));
    const draft = await screen.findByRole("textbox", { name: "New alias" });
    fireEvent.change(draft, { target: { value: "minimax-primary" } });
    fireEvent.click(screen.getByRole("button", { name: "Add alias" }));

    const alias = screen.getByRole("textbox", { name: "Alias 1" });
    expect((alias as HTMLInputElement).value).toBe("minimax-primary");
    fireEvent.change(alias, { target: { value: "minimax-production" } });
    fireEvent.click(screen.getByRole("tab", { name: "Essencial" }));

    expect(screen.queryByRole("textbox", { name: "Alias 1" })).toBeNull();
    fireEvent.click(screen.getByRole("tab", { name: "Aliases" }));
    expect(
      (screen.getByRole("textbox", { name: "Alias 1" }) as HTMLInputElement)
        .value,
    ).toBe("minimax-production");
    fireEvent.click(screen.getByRole("button", { name: "Save settings" }));

    await waitFor(() =>
      expect(saveModel).toHaveBeenCalledWith({
        data: expect.objectContaining({ aliases: ["minimax-production"] }),
      }),
    );
  });
});
