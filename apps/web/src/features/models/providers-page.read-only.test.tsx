import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./use-providers-page", () => ({
  useProvidersPage: () => ({
    providers: [
      {
        providerId: "provider-1",
        providerName: "openai-production",
        isDefault: true,
        provider: "openai",
        baseUrl: "https://api.openai.com/v1",
        hasStoredSecret: true,
        createdAt: null,
        updatedAt: null,
      },
    ],
    defaultProvider: "openai-production",
    isLoading: false,
    error: null,
  }),
}));

import { ProvidersPage } from "./providers-page";

describe("ProvidersPage", () => {
  it("renders provider data with a read-only handoff and no writer controls", () => {
    render(<ProvidersPage />);

    expect(screen.getByText("openai-production")).toBeInTheDocument();
    expect(screen.getByText(/read-only/i)).toBeInTheDocument();
    expect(screen.getByText(/apps\/ui/i)).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /add|edit|delete|save/i }),
    ).toBeNull();
  });
});
