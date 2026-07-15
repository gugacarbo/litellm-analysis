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
} from "../server/application-secrets.functions";
import { SecretsPage } from "./secrets-page";

vi.mock("@/features/model-admin/server/application-secrets.functions", () => ({
  listApplicationSecrets: vi.fn(),
  replaceApplicationSecret: vi.fn(),
  removeApplicationSecret: vi.fn(),
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
    expect(screen.getByText("Configured")).toBeTruthy();
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

    fireEvent.click(screen.getByRole("button", { name: "Replace key" }));
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

    fireEvent.click(screen.getByRole("button", { name: "Remove key" }));
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
