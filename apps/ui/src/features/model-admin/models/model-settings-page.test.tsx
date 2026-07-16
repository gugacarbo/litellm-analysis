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
  canonicalSlug: "minimax-m3",
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
    supportsVision: false,
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
    await screen.findByDisplayValue("minimax-m3");

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
  });

  it("expõe a configuração avançada em campos organizados, sem JSON bruto", async () => {
    const { container } = renderPage();

    expect(
      await screen.findByRole("button", {
        name: "Capabilities, routing and request options",
      }),
    ).toBeTruthy();
    for (const section of [
      "Architecture",
      "Reasoning",
      "Parameters",
      "Per-request limits",
      "Pricing",
      "Request options",
      "Reasoning API model ID",
    ]) {
      expect(screen.getByRole("button", { name: section })).toBeTruthy();
    }

    expect(await screen.findByText("Input modalities")).toBeTruthy();
    expect(screen.getByText("Output modalities")).toBeTruthy();
    expect(screen.getByLabelText("Tokenizer")).toBeTruthy();
    expect(container.querySelector("#advanced-configuration")).toBeNull();
  });
});
