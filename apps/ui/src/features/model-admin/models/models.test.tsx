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
  canonicalSlug: null,
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

function renderPage(role: "admin" | "viewer" = "viewer") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  queryClient.setQueryData(["model-admin", "models", "list"], [model]);
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

    expect(screen.getByText("OpenAI/gpt-5.6-luna")).toBeTruthy();
    expect(screen.queryByRole("button", { name: /new model/i })).toBeNull();

    fireEvent.change(screen.getByLabelText(/search models/i), {
      target: { value: "missing" },
    });
    expect(screen.getByText(/no models match/i)).toBeTruthy();
  });

  it("abre o formulário de criação em um dialog para admin", () => {
    renderPage("admin");

    expect(screen.queryByRole("dialog")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "New model" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByRole("heading", { name: "New model" })).toBeTruthy();
  });
});
