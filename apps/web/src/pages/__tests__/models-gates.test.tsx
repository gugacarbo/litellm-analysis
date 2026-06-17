import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithQueryClient } from "../../__tests__/react-query-test-utils";

vi.mock("@/features/monitor/components/health-status-content", () => ({
  HealthStatusContent: () => <div>Mock health check content</div>,
}));

vi.mock("@/features/monitor/hooks/use-health-status-websocket", () => ({
  useHealthStatusWebSocket: () => ({
    status: "disconnected",
    latestResults: [],
    rejectedMap: new Map(),
    runningExecutions: new Map(),
    partialMessages: new Map(),
    send: vi.fn(),
  }),
}));

vi.mock("@/shared/lib/api-client/health-check", () => ({
  getLatestHealthChecks: vi.fn().mockResolvedValue({ checks: [] }),
}));

vi.mock("@/shared/lib/api-client", () => {
  const mockModels = [
    {
      modelName: "gpt-4",
      status: "synced" as const,
      modelRoute: {
        modelName: "gpt-4",
        upstreamBaseUrl: "https://api.openai.com/v1",
        inputCostPerToken: 0.00003,
        outputCostPerToken: 0.00006,
      },
    },
    {
      modelName: "claude-3-opus",
      status: "synced" as const,
      modelRoute: {
        modelName: "claude-3-opus",
        upstreamBaseUrl: "https://api.anthropic.com",
        inputCostPerToken: 0.000015,
        outputCostPerToken: 0.000075,
      },
    },
  ];

  return {
    getAllModels: vi.fn().mockResolvedValue(mockModels),
    getModelsWithConfig: vi.fn().mockResolvedValue({
      models: mockModels,
      counts: { synced: 2, configOnly: 0, registryOnly: 0, total: 2 },
    }),
    createModel: vi.fn().mockResolvedValue(undefined),
    updateModel: vi.fn().mockResolvedValue(undefined),
    deleteModel: vi.fn().mockResolvedValue(undefined),
    getModelStatistics: vi.fn().mockResolvedValue([]),
    deleteModelLogs: vi.fn().mockResolvedValue(undefined),
    mergeModels: vi.fn().mockResolvedValue(undefined),
    getModelsSyncDiff: vi.fn().mockResolvedValue({ items: [] }),
    syncModelsBatch: vi.fn().mockResolvedValue({ success: true, applied: 0 }),
    addModelToConfig: vi.fn().mockResolvedValue({ success: true }),
    getDefaultSettingsDiff: vi
      .fn()
      .mockResolvedValue({ count: 0, mismatchedModels: [] }),
    getModelProvider: vi
      .fn()
      .mockResolvedValue({ defaultCredential: "", provider: "local-proxy" }),
    syncDefaultSettings: vi.fn().mockResolvedValue({ success: true }),
    toggleModelEnabled: vi.fn().mockResolvedValue({ success: true }),
    updateModelProvider: vi.fn().mockResolvedValue({ success: true }),
    getAgentRoutingConfig: vi.fn().mockResolvedValue({}),
    getAgentDefinitions: vi.fn().mockResolvedValue({
      agents: [],
      categories: [],
    }),
    updateAgentRoutingConfig: vi.fn().mockResolvedValue({ success: true }),
  };
});

import { ModelsConfiguredPage } from "@/features/models/models-configured-page";

describe("ModelsConfiguredPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should show create button", async () => {
    renderWithQueryClient(<ModelsConfiguredPage />);

    const modelNames = await screen.findAllByText(/gpt-4|claude-3-opus/);
    expect(modelNames.length).toBeGreaterThan(0);

    expect(
      screen.getByRole("button", { name: /add model/i }),
    ).toBeInTheDocument();
  });

  it("should show delete buttons", async () => {
    renderWithQueryClient(<ModelsConfiguredPage />);

    await screen.findAllByText(/gpt-4|claude-3-opus/);

    const deleteButtons = screen
      .getAllByRole("button")
      .filter((btn) => btn.querySelector("svg.lucide-trash-2"));
    expect(deleteButtons.length).toBeGreaterThanOrEqual(2);
  });

  it("should show edit link", async () => {
    renderWithQueryClient(<ModelsConfiguredPage />);

    await screen.findAllByText(/gpt-4|claude-3-opus/);

    const editLinks = screen
      .getAllByRole("link")
      .filter((link) => link.querySelector("svg.lucide-pencil"));
    expect(editLinks.length).toBe(2);
  });
});
