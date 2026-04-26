import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQueryClient } from "../../__tests__/react-query-test-utils";
import type { AnalyticsCapabilities } from "../../types/analytics";

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
  createModel: true,
  updateModel: true,
  deleteModel: true,
  mergeModels: true,
  deleteModelLogs: true,
  agentRouting: true,
};

const emptyModelStatsResponse = [
  {
    model: "",
    request_count: 3,
    total_spend: 1.5,
    total_tokens: 1200,
    prompt_tokens: 700,
    completion_tokens: 500,
    avg_tokens_per_request: 400,
    avg_latency_ms: 1000,
    success_rate: 100,
    error_count: 0,
    avg_input_cost: 0.00001,
    avg_output_cost: 0.00002,
    p50_latency_ms: 900,
    p95_latency_ms: 1100,
    p99_latency_ms: 1200,
    first_seen: "2025-01-01T00:00:00Z",
    last_seen: "2025-01-02T00:00:00Z",
    unique_users: 1,
    unique_api_keys: 1,
  },
];

vi.mock("../../hooks/use-server-mode", () => ({
  useServerMode: () => ({
    mode: "database",
    capabilities: mockCapabilities,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock("../../lib/api-client", () => ({
  getModelStatistics: vi.fn(),
  deleteModelLogs: vi.fn(),
  mergeModels: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("sonner", async (importOriginal) => {
  const actual = await importOriginal<typeof import("sonner")>();
  return {
    ...actual,
    toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
  };
});

import * as apiClient from "../../lib/api-client";
import { ModelStatsPage } from "../model-stats";

describe("ModelStatsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(apiClient.getModelStatistics).mockResolvedValue(
      emptyModelStatsResponse,
    );
    vi.mocked(apiClient.deleteModelLogs).mockResolvedValue({ success: true });
  });

  it("deletes stats rows with empty model name", async () => {
    renderWithQueryClient(<ModelStatsPage />);

    await screen.findByText("(no model)");

    await userEvent.click(screen.getByRole("button", { name: "×" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => {
      expect(apiClient.deleteModelLogs).toHaveBeenCalledWith("");
    });
  });
});
