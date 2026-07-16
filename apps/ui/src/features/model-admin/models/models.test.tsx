/** @vitest-environment jsdom */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/features/model-admin/server/model-admin.functions", () => ({
  listModels: vi.fn(),
  listProviders: vi.fn(),
  saveModel: vi.fn(),
  toggleModel: vi.fn(),
  deleteModel: vi.fn(),
}));

import { ModelsPage } from "./models-page";

const model = {
  id: "1f0d1ca2-77a4-4a28-a891-c0708340a7c1",
  providerId: "1f0d1ca2-77a4-4a28-a891-c0708340a7c2",
  providerName: "OpenAI",
  modelId: "gpt-5.6-luna",
  displayName: "Luna",
  enabled: true,
  revision: 3,
  createdAt: new Date(),
  updatedAt: new Date(),
  family: null,
  description: null,
  contextLength: null,
  maxCompletionTokens: null,
  knowledgeCutoff: null,
  expirationDate: null,
  architecture: null,
  reasoning: null,
  supportedParameters: null,
  defaultParameters: null,
  perRequestLimits: null,
  pricing: null,
  requestOptions: null,
  reasoningApiId: null,
};
const secondModel = {
  ...model,
  id: "1f0d1ca2-77a4-4a28-a891-c0708340a7c3",
  providerId: "1f0d1ca2-77a4-4a28-a891-c0708340a7c4",
  providerName: "Anthropic",
  modelId: "claude-sonnet",
  displayName: "Sonnet",
  revision: 1,
};

function renderPage(role: "admin" | "viewer" = "viewer") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  queryClient.setQueryData(
    ["model-admin", "models", "list"],
    [model, secondModel],
  );
  queryClient.setQueryData(["model-admin", "providers", "list"], []);
  return render(
    <QueryClientProvider client={queryClient}>
      <ModelsPage role={role} />
    </QueryClientProvider>,
  );
}

describe("ModelsPage", () => {
  it("filtra a lista e não renderiza controles de mutação para viewer", () => {
    renderPage();

    expect(screen.getByText("gpt-5.6-luna")).toBeTruthy();
    expect(screen.getByText("OpenAI")).toBeTruthy();
    expect(screen.getByRole("table")).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Model" })).toBeTruthy();
    expect(screen.getByRole("columnheader", { name: "Provider" })).toBeTruthy();
    expect(
      screen.getByRole("columnheader", { name: "Display name" }),
    ).toBeTruthy();
    expect(screen.queryByRole("columnheader", { name: "Revision" })).toBeNull();
    expect(screen.queryByRole("columnheader", { name: "Actions" })).toBeNull();
    expect(screen.queryByRole("button", { name: /new model/i })).toBeNull();

    fireEvent.change(screen.getByLabelText(/search models/i), {
      target: { value: "missing" },
    });
    expect(screen.getByText(/no models match/i)).toBeTruthy();
  });

  it("ordena pelos cabeçalhos clicáveis", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "Model" }));

    expect(screen.getAllByRole("row")[1]?.textContent).toContain(
      "claude-sonnetAnthropic",
    );
  });

  it("abre o formulário de criação em um dialog para admin", () => {
    renderPage("admin");

    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "New model" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "New model" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Disable" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
  });
});
