import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQueryClient } from "../../__tests__/react-query-test-utils";
import type { AnalyticsCapabilities } from "../../types/analytics";

// vi.mock is hoisted by vitest — the import below MUST come after the mock definitions
const mockCapabilities: AnalyticsCapabilities = {
  spendByModel: true,
  spendByUser: true,
  spendByKey: true,
  spendLogs: true,
  metricsSummary: true,
  dailySpendTrend: true,
  tokenDistribution: true,
  performanceMetrics: true,
  hourlyUsagePatterns: true,
  apiKeyStats: true,
  costEfficiency: true,
  modelDistribution: true,
  dailyTokenTrend: true,
  modelStatistics: true,
  models: true,
  errorLogs: true,
  detailedLatency: true,
  logMerge: true,
  filterOptions: true,
  createModel: false,
  updateModel: true,
  deleteModel: false,
  mergeModels: false,
  deleteModelLogs: false,
  agentRouting: false,
};

vi.mock("../../hooks/use-server-mode", () => ({
  useServerMode: () => ({
    mode: "limited",
    capabilities: mockCapabilities,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

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

describe("ModelsPage UI gates (limited mode)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should hide create button when createModel=false", async () => {
    renderWithQueryClient(<ModelsPage />);

    const modelNames = await screen.findAllByText(/gpt-4|claude-3-opus/);
    expect(modelNames.length).toBeGreaterThan(0);

    expect(
      screen.queryByRole("button", { name: /add model/i }),
    ).not.toBeInTheDocument();
  });

  it("should hide delete buttons when deleteModel=false", async () => {
    renderWithQueryClient(<ModelsPage />);

    await screen.findAllByText(/gpt-4|claude-3-opus/);

    const unavailableFeatures = screen.queryAllByText("Feature Unavailable");
    expect(unavailableFeatures.length).toBeGreaterThanOrEqual(2);
  });

  it("should show edit button when updateModel=true", async () => {
    renderWithQueryClient(<ModelsPage />);

    await screen.findAllByText(/gpt-4|claude-3-opus/);

    const editButtons = screen
      .getAllByRole("button", { name: "" })
      .filter((btn) => btn.querySelector("svg.lucide-pencil"));
    expect(editButtons.length).toBe(2);
  });
});
