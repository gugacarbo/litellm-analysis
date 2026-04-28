import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQueryClient } from "../../__tests__/react-query-test-utils";

vi.mock("../../lib/api-client", () => ({
  getModelStatistics: vi.fn().mockResolvedValue([
    {
      model: "gpt-4",
      request_count: 100,
      total_spend: 50.0,
      total_tokens: 500000,
      prompt_tokens: 300000,
      completion_tokens: 200000,
      avg_tokens_per_request: 5000,
      avg_latency_ms: 1200,
      success_rate: 98.5,
      error_count: 2,
      avg_input_cost: 0.00003,
      avg_output_cost: 0.00006,
      p50_latency_ms: 800,
      p95_latency_ms: 3000,
      p99_latency_ms: 5000,
      first_seen: "2025-01-01T00:00:00Z",
      last_seen: "2025-01-30T00:00:00Z",
      unique_users: 10,
      unique_api_keys: 5,
    },
    {
      model: "claude-3-opus",
      request_count: 50,
      total_spend: 30.0,
      total_tokens: 200000,
      prompt_tokens: 120000,
      completion_tokens: 80000,
      avg_tokens_per_request: 4000,
      avg_latency_ms: 1500,
      success_rate: 96.0,
      error_count: 2,
      avg_input_cost: 0.000015,
      avg_output_cost: 0.000075,
      p50_latency_ms: 1000,
      p95_latency_ms: 4000,
      p99_latency_ms: 7000,
      first_seen: "2025-01-05T00:00:00Z",
      last_seen: "2025-01-28T00:00:00Z",
      unique_users: 5,
      unique_api_keys: 3,
    },
  ]),
  deleteModelLogs: vi.fn().mockResolvedValue(undefined),
  mergeModels: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("sonner", async (importOriginal) => {
  const actual = await importOriginal<typeof import("sonner")>();
  return {
    ...actual,
    toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
  };
});

import { ModelStatsPage } from "../model-stats";

describe("ModelStatsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show merge button", async () => {
    renderWithQueryClient(<ModelStatsPage />);

    await screen.findAllByText(/gpt-4|claude-3-opus/);

    const mergeButton = screen.queryByRole("button", {
      name: /^merge models$/i,
    });
    expect(mergeButton).toBeInTheDocument();
    expect(mergeButton).not.toBeDisabled();
  });

  it("should show delete logs buttons", async () => {
    renderWithQueryClient(<ModelStatsPage />);

    await screen.findAllByText(/gpt-4|claude-3-opus/);

    const deleteButtons = screen.queryAllByRole("button", {
      name: /Delete/,
    });
    expect(deleteButtons.length).toBe(2);
    for (const btn of deleteButtons) {
      expect(btn).not.toBeDisabled();
    }
  });
});
