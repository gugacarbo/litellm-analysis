/** @vitest-environment jsdom */

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { createElement } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  listApplicationSecrets,
  removeApplicationSecret,
  replaceApplicationSecret,
  testApplicationSecret,
} from "../server/application-secrets.functions";
import {
  listProviders,
  testProvider,
  updateProvider,
} from "../server/model-admin.functions";
import { SecretsPage } from "./secrets-page";

vi.mock("@/features/model-admin/server/application-secrets.functions", () => ({
  listApplicationSecrets: vi.fn(),
  replaceApplicationSecret: vi.fn(),
  removeApplicationSecret: vi.fn(),
  testApplicationSecret: vi.fn(),
}));

vi.mock("@/features/model-admin/server/model-admin.functions", () => ({
  listProviders: vi.fn(),
  testProvider: vi.fn(),
  updateProvider: vi.fn(),
}));

function renderPage() {
  vi.mocked(listApplicationSecrets).mockResolvedValue({
    ok: true,
    data: [
      {
        key: "artificial_analysis_api_key",
        isConfigured: true,
        createdAt: new Date("2026-07-14T00:00:00.000Z"),
        updatedAt: new Date("2026-07-14T00:00:00.000Z"),
      },
      {
        key: "openrouter_api_key",
        isConfigured: false,
        createdAt: null,
        updatedAt: null,
      },
    ],
  });
  vi.mocked(listProviders).mockResolvedValue({
    ok: true,
    data: [
      {
        id: "00000000-0000-0000-0000-000000000001",
        name: "OpenAI production",
        provider: "openai-compatible",
        baseUrl: "https://api.openai.com/v1",
        isDefault: true,
        hasStoredSecret: true,
        credentialStatus: "configured",
        modelCount: 2,
        revision: 1,
        createdAt: new Date("2026-07-14T00:00:00.000Z"),
        updatedAt: new Date("2026-07-14T00:00:00.000Z"),
      },
    ],
  });
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: Number.POSITIVE_INFINITY },
    },
  });
  queryClient.setQueryData(
    ["model-admin", "application-secrets", "list"],
    [
      {
        key: "artificial_analysis_api_key",
        isConfigured: true,
        createdAt: new Date("2026-07-14T00:00:00.000Z"),
        updatedAt: new Date("2026-07-14T00:00:00.000Z"),
      },
      {
        key: "openrouter_api_key",
        isConfigured: false,
        createdAt: null,
        updatedAt: null,
      },
    ],
  );
  queryClient.setQueryData(
    ["model-admin", "providers", "list"],
    [
      {
        id: "00000000-0000-0000-0000-000000000001",
        name: "OpenAI production",
        provider: "openai-compatible",
        baseUrl: "https://api.openai.com/v1",
        isDefault: true,
        hasStoredSecret: true,
        credentialStatus: "configured",
        modelCount: 2,
        revision: 1,
        createdAt: new Date("2026-07-14T00:00:00.000Z"),
        updatedAt: new Date("2026-07-14T00:00:00.000Z"),
      },
    ],
  );

  return render(
    createElement(
      QueryClientProvider,
      { client: queryClient },
      createElement(SecretsPage),
    ),
  );
}

afterEach(cleanup);

describe("SecretsPage", () => {
  it("renders the two fixed metadata-only statuses", () => {
    renderPage();

    expect(
      screen.getByRole("heading", { name: "Application secrets" }),
    ).toBeTruthy();
    expect(screen.getByText("Artificial Analysis")).toBeTruthy();
    expect(screen.getByText("OpenRouter")).toBeTruthy();
    expect(
      screen.getByText("https://artificialanalysis.ai/api/v2"),
    ).toBeTruthy();
    expect(screen.getByText("https://openrouter.ai/api/v1")).toBeTruthy();
    expect(
      screen.getByRole("heading", { name: "Provider credentials" }),
    ).toBeTruthy();
    expect(screen.getByText("OpenAI production")).toBeTruthy();
    expect(screen.getAllByText("Configured")).toHaveLength(2);
    expect(screen.getByText("Not configured")).toBeTruthy();
    expect(screen.queryByDisplayValue(/.+/)).toBeNull();
  });

  it("clears the password field after a successful replacement", async () => {
    vi.mocked(replaceApplicationSecret).mockResolvedValueOnce({
      ok: true,
      data: {
        key: "artificial_analysis_api_key",
        isConfigured: true,
        createdAt: new Date("2026-07-14T00:00:00.000Z"),
        updatedAt: new Date("2026-07-14T00:00:00.000Z"),
      },
    });
    renderPage();

    fireEvent.click(
      screen.getByRole("button", { name: "Actions for Artificial Analysis" }),
    );
    fireEvent.click(screen.getByRole("menuitem", { name: "Replace key" }));
    expect(screen.queryByText("Artificial Analysis")).toBeNull();
    const field = screen.getByLabelText("API key for Artificial Analysis");
    fireEvent.change(field, { target: { value: "never-render-this-secret" } });
    fireEvent.click(screen.getByRole("button", { name: "Save key" }));

    await waitFor(() => {
      expect(replaceApplicationSecret).toHaveBeenCalledWith({
        data: {
          key: "artificial_analysis_api_key",
          value: "never-render-this-secret",
        },
      });
      expect(
        screen.queryByLabelText("API key for Artificial Analysis"),
      ).toBeNull();
      expect(screen.queryByDisplayValue("never-render-this-secret")).toBeNull();
    });
  });

  it("shows live application secret test status in a dialog", async () => {
    vi.mocked(testApplicationSecret).mockResolvedValueOnce({
      ok: true,
      data: { message: "Connection successful." },
    });
    renderPage();

    fireEvent.click(
      screen.getByRole("button", { name: "Actions for Artificial Analysis" }),
    );
    fireEvent.click(screen.getByRole("menuitem", { name: "Test" }));
    expect(screen.getByRole("dialog")).toBeTruthy();
    expect(screen.getByText("Testing connection…")).toBeTruthy();

    await waitFor(() => {
      expect(screen.getByText("Connection successful.")).toBeTruthy();
    });
  });

  it("tests a provider connection without requiring discovery data", async () => {
    vi.mocked(testProvider).mockResolvedValueOnce({
      ok: true,
      data: { message: "Connection successful." },
    });
    renderPage();

    fireEvent.click(
      screen.getByRole("button", { name: "Actions for OpenAI production" }),
    );
    fireEvent.click(screen.getByRole("menuitem", { name: "Test" }));

    await waitFor(() => {
      expect(testProvider).toHaveBeenCalledWith({
        data: { id: "00000000-0000-0000-0000-000000000001" },
      });
      expect(screen.getByText("Connection successful.")).toBeTruthy();
    });
  });

  it("updates a provider key without rendering it", async () => {
    vi.mocked(updateProvider).mockResolvedValueOnce({
      ok: true,
      data: {
        id: "00000000-0000-0000-0000-000000000001",
        name: "OpenAI production",
        provider: "openai-compatible",
        baseUrl: "https://api.openai.com/v1",
        isDefault: true,
        hasStoredSecret: true,
        credentialStatus: "configured",
        modelCount: 2,
        revision: 2,
        createdAt: new Date("2026-07-14T00:00:00.000Z"),
        updatedAt: new Date("2026-07-15T00:00:00.000Z"),
      },
    });
    renderPage();

    fireEvent.click(
      screen.getByRole("button", { name: "Actions for OpenAI production" }),
    );
    fireEvent.click(screen.getByRole("menuitem", { name: "Update key" }));
    const field = screen.getByLabelText("API key for OpenAI production");
    fireEvent.change(field, {
      target: { value: "never-render-this-provider-secret" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save key" }));

    await waitFor(() => {
      expect(updateProvider).toHaveBeenCalledWith({
        data: {
          id: "00000000-0000-0000-0000-000000000001",
          expectedRevision: 1,
          credential: {
            kind: "replace",
            value: "never-render-this-provider-secret",
          },
        },
      });
      expect(
        screen.queryByDisplayValue("never-render-this-provider-secret"),
      ).toBeNull();
    });
  });

  it("requires confirmation before removing a configured key", async () => {
    vi.mocked(removeApplicationSecret).mockResolvedValueOnce({
      ok: true,
      data: {
        key: "artificial_analysis_api_key",
        isConfigured: false,
        createdAt: null,
        updatedAt: null,
      },
    });
    renderPage();

    fireEvent.click(
      screen.getByRole("button", { name: "Actions for Artificial Analysis" }),
    );
    fireEvent.click(screen.getByRole("menuitem", { name: "Remove key" }));
    expect(removeApplicationSecret).not.toHaveBeenCalled();

    const dialog = await screen.findByRole("alertdialog");
    fireEvent.click(within(dialog).getByRole("button", { name: "Remove key" }));
    await waitFor(() => {
      expect(removeApplicationSecret).toHaveBeenCalledWith({
        data: { key: "artificial_analysis_api_key" },
      });
    });
  });
});
