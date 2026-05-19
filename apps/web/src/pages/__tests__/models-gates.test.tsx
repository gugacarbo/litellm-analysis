import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQueryClient } from "../../__tests__/react-query-test-utils";

vi.mock("../../lib/api-client", () => {
  const mockModels = [
    {
      modelName: "gpt-4",
      status: "synced" as const,
      litellmParams: {
        api_base: "https://api.openai.com/v1",
        input_cost_per_token: 0.00003,
        output_cost_per_token: 0.00006,
      },
    },
    {
      modelName: "claude-3-opus",
      status: "synced" as const,
      litellmParams: {
        api_base: "https://api.anthropic.com",
        input_cost_per_token: 0.000015,
        output_cost_per_token: 0.000075,
      },
    },
  ];

  return {
    getAllModels: vi.fn().mockResolvedValue(mockModels),
    getModelsWithConfig: vi.fn().mockResolvedValue({
      models: mockModels,
      counts: { synced: 2, configOnly: 0, litellmOnly: 0, total: 2 },
    }),
    createModel: vi.fn().mockResolvedValue(undefined),
    updateModel: vi.fn().mockResolvedValue(undefined),
    deleteModel: vi.fn().mockResolvedValue(undefined),
    getModelStatistics: vi.fn().mockResolvedValue([]),
    deleteModelLogs: vi.fn().mockResolvedValue(undefined),
    mergeModels: vi.fn().mockResolvedValue(undefined),
    syncModelsFromConfig: vi.fn().mockResolvedValue({ success: true }),
    addModelToConfig: vi.fn().mockResolvedValue({ success: true }),
    getAgentRoutingConfig: vi.fn().mockResolvedValue({}),
    getAgentDefinitions: vi.fn().mockResolvedValue({
      agents: [],
      categories: [],
    }),
    updateAgentRoutingConfig: vi.fn().mockResolvedValue({ success: true }),
  };
});

import { ModelsPage } from "@/features/models/list-index";

describe("ModelsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show create button", async () => {
    renderWithQueryClient(<ModelsPage />);

    const modelNames = await screen.findAllByText(/gpt-4|claude-3-opus/);
    expect(modelNames.length).toBeGreaterThan(0);

    expect(
      screen.getByRole("button", { name: /add model/i }),
    ).toBeInTheDocument();
  });

  it("should show delete buttons", async () => {
    renderWithQueryClient(<ModelsPage />);

    await screen.findAllByText(/gpt-4|claude-3-opus/);

    const deleteButtons = screen
      .getAllByRole("button")
      .filter((btn) => btn.querySelector("svg.lucide-trash-2"));
    expect(deleteButtons.length).toBeGreaterThanOrEqual(2);
  });

  it("should show edit link", async () => {
    renderWithQueryClient(<ModelsPage />);

    await screen.findAllByText(/gpt-4|claude-3-opus/);

    const editLinks = screen
      .getAllByRole("link")
      .filter((link) => link.querySelector("svg.lucide-pencil"));
    expect(editLinks.length).toBe(2);
  });
});
