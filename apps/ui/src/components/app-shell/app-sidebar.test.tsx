/** @vitest-environment jsdom */

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "./app-shell";

afterEach(cleanup);

const defaultProps = {
  pathname: "/",
  sidebar: "expanded" as const,
  theme: "light" as const,
  onSidebarChange: vi.fn(),
  onThemeChange: vi.fn(),
};

describe("AppShell", () => {
  it("renders only Dashboard for the active root route", () => {
    render(<AppShell {...defaultProps}>Dashboard content</AppShell>);

    const dashboardLinks = screen.getAllByRole("link", { name: "Dashboard" });

    expect(dashboardLinks).toHaveLength(1);
    expect(dashboardLinks[0].getAttribute("href")).toBe("/");
    expect(dashboardLinks[0].getAttribute("aria-current")).toBe("page");
    expect(
      screen.queryByRole("link", { name: /logs|models|providers/i }),
    ).toBeNull();
  });

  it("persists desktop sidebar changes through its callback", () => {
    const onSidebarChange = vi.fn();

    render(<AppShell {...defaultProps} onSidebarChange={onSidebarChange} />);

    fireEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }));

    expect(onSidebarChange).toHaveBeenCalledWith("collapsed");
  });

  it("keeps the mobile drawer closed initially and never persists its transient state", async () => {
    const onSidebarChange = vi.fn();

    render(<AppShell {...defaultProps} onSidebarChange={onSidebarChange} />);

    const menuButton = screen.getByRole("button", { name: "Open navigation" });
    expect(
      screen.queryByRole("dialog", { name: "Mobile navigation" }),
    ).toBeNull();

    fireEvent.click(menuButton);

    expect(
      await screen.findByRole("dialog", { name: "Mobile navigation" }),
    ).toBeTruthy();
    expect(onSidebarChange).not.toHaveBeenCalled();

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(
        screen.queryByRole("dialog", { name: "Mobile navigation" }),
      ).toBeNull();
    });
    expect(onSidebarChange).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(menuButton);
  });
});
