import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/features/agents", () => ({
  AgentConfigPage: () => <div>Agent Config Page</div>,
}));

vi.mock("@/features/agents/list-index", () => ({
  AgentsPage: () => <div>Agents Page</div>,
}));

vi.mock("@/features/benchmarks", () => ({
  BenchmarksPage: () => <div>Benchmarks Page</div>,
}));

vi.mock("@/features/dashboard", () => ({
  DashboardPage: () => <div>Dashboard Page</div>,
}));

vi.mock("@/features/logs", () => ({
  LogsPage: () => <div>Logs Page</div>,
}));

vi.mock("@/features/logs/chat-simulation", () => ({
  LogChatSimulationPage: () => <div>Chat Simulation Page</div>,
}));

vi.mock("@/features/logs/detail", () => ({
  LogDetailPage: () => <div>Log Detail Page</div>,
}));

vi.mock("@/features/model-stats/index", () => ({
  ModelStatsPage: () => <div>Model Stats Page</div>,
}));

vi.mock("@/features/models/providers-page", () => ({
  ProvidersPage: () => <div>Providers Page</div>,
}));

vi.mock("@/features/models/detail/model-detail-layout", () => ({
  ModelDetailLayout: () => <div>Model Detail Layout</div>,
}));

vi.mock("@/features/models/detail/model-detail-logs-route", () => ({
  ModelDetailLogsRoute: () => <div>Model Detail Logs Route</div>,
}));

vi.mock("@/features/models/detail/model-detail-overview-tab", () => ({
  ModelDetailOverviewTab: () => <div>Model Detail Overview Tab</div>,
}));

vi.mock("@/features/models/detail/model-detail-settings-tab", () => ({
  ModelDetailSettingsTab: () => <div>Model Detail Settings Tab</div>,
}));

vi.mock("@/features/models/models-configured-page", () => ({
  ModelsConfiguredPage: () => <div>Models Configured Page</div>,
}));

vi.mock("@/features/models/models-health-check-page", () => ({
  ModelsHealthCheckPage: () => <div>Models Health Check Page</div>,
}));

vi.mock("@/features/plugins", () => ({
  PluginConfigPage: () => <div>Plugin Config Page</div>,
}));

vi.mock("@/features/plugins/list-index", () => ({
  PluginsPage: () => <div>Plugins Page</div>,
}));

vi.mock("@/features/prompts/detail", () => ({
  PromptEvalDetailPage: () => <div>Prompt Eval Detail Page</div>,
}));

vi.mock("@/features/prompts/list-index", () => ({
  PromptEvalsPage: () => <div>Prompt Evals Page</div>,
}));

vi.mock("@/features/floating-chat/floating-chat-widget", () => ({
  FloatingChatWidget: () => null,
}));

vi.mock("@/shared/components/ui/date-range-filter", () => ({
  DateRangeFilter: () => <div>Date Range Filter</div>,
}));

vi.mock("@/shared/lib/api-client/model-aliases", () => ({
  getAllModelAliases: vi.fn(),
  deleteModelAlias: vi.fn(),
}));

vi.mock("sonner", async (importOriginal) => {
  const actual = await importOriginal<typeof import("sonner")>();
  return {
    ...actual,
    toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
  };
});

import { toast } from "sonner";
import App from "@/App";
import {
  deleteModelAlias,
  getAllModelAliases,
} from "@/shared/lib/api-client/model-aliases";

describe("models aliases page", () => {
  let aliasesState = [
    { alias: "gpt-4o-mini-fast", targetModel: "gpt-4o-mini" },
    { alias: "gpt-4o-reasoning", targetModel: "gpt-4o" },
    { alias: "claude-opus-latest", targetModel: "claude-3-opus" },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    window.history.pushState({}, "", "/models/aliases");
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
    Element.prototype.hasPointerCapture = vi.fn().mockReturnValue(false);
    Element.prototype.setPointerCapture = vi.fn();
    Element.prototype.releasePointerCapture = vi.fn();
    HTMLElement.prototype.scrollIntoView = vi.fn();
    aliasesState = [
      { alias: "gpt-4o-mini-fast", targetModel: "gpt-4o-mini" },
      { alias: "gpt-4o-reasoning", targetModel: "gpt-4o" },
      { alias: "claude-opus-latest", targetModel: "claude-3-opus" },
    ];

    vi.mocked(getAllModelAliases).mockImplementation(async () => ({
      aliases: aliasesState.map((entry) => ({ ...entry })),
    }));

    vi.mocked(deleteModelAlias).mockImplementation(async (alias) => {
      const index = aliasesState.findIndex((entry) => entry.alias === alias);
      if (index >= 0) {
        aliasesState.splice(index, 1);
      }
      return { success: true };
    });
  });

  it("resolves /models/aliases and filters aliases before removing one", async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>,
    );

    expect(
      await screen.findByRole("heading", { name: "Model Aliases" }),
    ).toBeInTheDocument();

    expect(
      await screen.findByRole("link", { name: "gpt-4o-mini" }),
    ).toHaveAttribute("href", "/models/gpt-4o-mini");

    const searchInput = screen.getByPlaceholderText("Search aliases");

    await userEvent.type(searchInput, "reasoning");

    await waitFor(() => {
      expect(screen.getByText("gpt-4o-reasoning")).toBeInTheDocument();
      expect(screen.queryByText("gpt-4o-mini-fast")).not.toBeInTheDocument();
      expect(screen.queryByText("claude-opus-latest")).not.toBeInTheDocument();
    });

    await userEvent.clear(searchInput);
    await userEvent.click(screen.getByRole("combobox"));
    await userEvent.click(
      await screen.findByRole("option", { name: "gpt-4o-mini" }),
    );

    await waitFor(() => {
      expect(screen.getByText("gpt-4o-mini-fast")).toBeInTheDocument();
      expect(screen.queryByText("gpt-4o-reasoning")).not.toBeInTheDocument();
    });

    const removeButton = screen.getByRole("button", {
      name: "Remove alias gpt-4o-mini-fast",
    });
    expect(removeButton).toBeInTheDocument();

    await userEvent.click(removeButton);
    await userEvent.click(screen.getByRole("button", { name: "Remove alias" }));

    await waitFor(() => {
      expect(vi.mocked(deleteModelAlias).mock.calls[0]?.[0]).toBe(
        "gpt-4o-mini-fast",
      );
      expect(screen.queryByText("gpt-4o-mini-fast")).not.toBeInTheDocument();
    });

    expect(toast.success).toHaveBeenCalledWith("Alias removed");
  });
});
