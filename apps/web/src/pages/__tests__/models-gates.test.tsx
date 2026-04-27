import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQueryClient } from "../../__tests__/react-query-test-utils";

vi.mock("../../lib/api-client", () => ({
  getAllModels: vi.fn().mockResolvedValue([
    {
      modelName: "gpt-4",
      litellmParams: {
        api_base: "https://api.openai.com/v1",
        input_cost_per_token: 0.00003,
        output_cost_per_token: 0.00006,
      },
    },
    {
      modelName: "claude-3-opus",
      litellmParams: {
        api_base: "https://api.anthropic.com",
        input_cost_per_token: 0.000015,
        output_cost_per_token: 0.000075,
      },
    },
  ]),
  createModel: vi.fn().mockResolvedValue(undefined),
  updateModel: vi.fn().mockResolvedValue(undefined),
  deleteModel: vi.fn().mockResolvedValue(undefined),
  getModelStatistics: vi.fn().mockResolvedValue([]),
  deleteModelLogs: vi.fn().mockResolvedValue(undefined),
  mergeModels: vi.fn().mockResolvedValue(undefined),
  getAgentRoutingConfig: vi.fn().mockResolvedValue({}),
  updateAgentRoutingConfig: vi.fn().mockResolvedValue({ success: true }),
}));

import { ModelsPage } from "../models";

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

  it("should show edit button", async () => {
    renderWithQueryClient(<ModelsPage />);

    await screen.findAllByText(/gpt-4|claude-3-opus/);

    const editButtons = screen
      .getAllByRole("button")
      .filter((btn) => btn.querySelector("svg.lucide-pencil"));
    expect(editButtons.length).toBe(2);
  });
});
