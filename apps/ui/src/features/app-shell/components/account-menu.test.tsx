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

import { SidebarProvider } from "../../../shared/components/ui/sidebar";
import { TooltipProvider } from "../../../shared/components/ui/tooltip";
import { AccountMenu } from "./account-menu";

const account = {
  name: "Ada Lovelace",
  email: "ada@example.com",
  role: "admin",
  theme: "light" as const,
  onThemeChange: vi.fn(),
};

function getAccountMenuTrigger(container: HTMLElement) {
  const trigger = container.querySelector<HTMLElement>(
    '[data-sidebar="menu-button"]',
  );

  if (!trigger) throw new Error("Account menu trigger was not rendered");
  return trigger;
}

function renderAccountMenu() {
  return render(
    <TooltipProvider>
      <SidebarProvider>
        <AccountMenu {...account} />
      </SidebarProvider>
    </TooltipProvider>,
  );
}

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
    const { container } = renderAccountMenu();

    fireEvent.click(getAccountMenuTrigger(container));
    expect(screen.getAllByText(account.name)).toHaveLength(2);
    expect(screen.getAllByText(account.email)).toHaveLength(2);
    expect(screen.getByText(account.role)).toBeTruthy();
    expect(screen.getByRole("menuitem", { name: "Switch to dark theme" }));
  });

  it("signs out through Better Auth and redirects to login after success", async () => {
    signOut.mockResolvedValue({ data: { success: true }, error: null });
    const { container } = renderAccountMenu();

    fireEvent.click(getAccountMenuTrigger(container));
    fireEvent.click(screen.getByRole("menuitem", { name: /sign out/i }));

    await waitFor(() => expect(signOut).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(assign).toHaveBeenCalledWith("/login"));
  });

  it("keeps the account menu visible and offers a recoverable error on sign-out failure", async () => {
    signOut.mockResolvedValue({
      data: null,
      error: { message: "Sign-out service is unavailable" },
    });
    const { container } = renderAccountMenu();

    fireEvent.click(getAccountMenuTrigger(container));
    fireEvent.click(screen.getByRole("menuitem", { name: /sign out/i }));

    expect(
      await screen.findByRole("alert", { name: "Account menu error" }),
    ).toBeTruthy();
    expect(screen.getAllByText(account.name)).toHaveLength(2);
    expect(screen.getAllByText(account.email)).toHaveLength(2);
    expect(screen.getByText(account.role)).toBeTruthy();
    expect(assign).not.toHaveBeenCalled();
    expect(screen.getByRole("menuitem", { name: /sign out/i })).toBeTruthy();
  });

  it("toggles the theme with one menu action", async () => {
    const { container } = renderAccountMenu();

    fireEvent.click(getAccountMenuTrigger(container));
    fireEvent.click(
      screen.getByRole("menuitem", { name: "Switch to dark theme" }),
    );

    await waitFor(() =>
      expect(account.onThemeChange).toHaveBeenCalledWith("dark"),
    );
  });
});
