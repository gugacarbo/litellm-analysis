// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { signOut } = vi.hoisted(() => ({
  signOut: vi.fn(),
}));
const { assign } = vi.hoisted(() => ({
  assign: vi.fn(),
}));

vi.mock("better-auth/react", () => ({
  createAuthClient: () => ({ signOut }),
}));

import { AccountMenu } from "./account-menu";

const account = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  role: "admin",
};

describe("AccountMenu", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("location", { assign });
  });

  it("shows only the supplied public account data", () => {
    render(<AccountMenu {...account} />);

    expect(screen.getByText(account.name)).toBeTruthy();
    expect(screen.getByText(account.email)).toBeTruthy();
    expect(screen.getByText(account.role)).toBeTruthy();
    expect(screen.queryByText(/theme/i)).toBeNull();
  });

  it("signs out through Better Auth and redirects to login after success", async () => {
    signOut.mockResolvedValue({ data: { success: true }, error: null });
    render(<AccountMenu {...account} />);

    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));

    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(assign).toHaveBeenCalledWith("/login"));
  });

  it("keeps the account menu visible and offers a recoverable error on sign-out failure", async () => {
    signOut.mockResolvedValue({
      data: null,
      error: { message: "Sign-out service is unavailable" },
    });
    render(<AccountMenu {...account} />);

    fireEvent.click(screen.getByRole("button", { name: /sign out/i }));

    expect(
      await screen.findByRole("alert", { name: /could not sign out/i }),
    ).toBeTruthy();
    expect(screen.getByText(account.name)).toBeTruthy();
    expect(screen.getByText(account.email)).toBeTruthy();
    expect(screen.getByText(account.role)).toBeTruthy();
    expect(assign).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /sign out/i })).toBeTruthy();
  });
});
