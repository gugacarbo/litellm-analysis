/** @vitest-environment jsdom */

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AppShell } from "@/features/app-shell/components/app-shell";

afterEach(cleanup);

function setViewportWidth(width: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: width,
  });
}

function getSidebarTrigger(container: HTMLElement) {
  const trigger = container.querySelector<HTMLElement>(
    '[data-sidebar="trigger"]',
  );

  if (!trigger) throw new Error("Sidebar trigger was not rendered");
  return trigger;
}

const defaultProps = {
  pathname: "/",
  sidebar: "expanded" as const,
  onSidebarChange: vi.fn(),
};

describe("AppShell", () => {
  it("renders Models in the protected navigation when its routes are available", () => {
    render(<AppShell {...defaultProps}>Dashboard content</AppShell>);

    const dashboardLinks = screen.getAllByRole("link", { name: "Dashboard" });

    expect(dashboardLinks).toHaveLength(1);
    expect(dashboardLinks[0].getAttribute("href")).toBe("/");
    expect(dashboardLinks[0].getAttribute("aria-current")).toBe("page");
    const modelsLink = screen.getByRole("link", { name: "Models" });
    expect(modelsLink.getAttribute("href")).toBe("/models");
    expect(modelsLink.getAttribute("aria-current")).toBeNull();
  });

  it("persists desktop sidebar changes through its callback", () => {
    const onSidebarChange = vi.fn();

    const { container } = render(
      <AppShell {...defaultProps} onSidebarChange={onSidebarChange} />,
    );

    fireEvent.click(getSidebarTrigger(container));

    expect(onSidebarChange).toHaveBeenCalledWith("collapsed");
  });

  it("keeps the mobile drawer closed initially and never persists its transient state", async () => {
    const onSidebarChange = vi.fn();
    setViewportWidth(767);

    const { container } = render(
      <AppShell {...defaultProps} onSidebarChange={onSidebarChange} />,
    );

    await waitFor(() =>
      expect(screen.queryByRole("link", { name: "Dashboard" })).toBeNull(),
    );
    const menuButton = getSidebarTrigger(container);
    expect(screen.queryByRole("dialog", { name: "Sidebar" })).toBeNull();

    fireEvent.click(menuButton);

    expect(await screen.findByRole("dialog", { name: "Sidebar" })).toBeTruthy();
    expect(onSidebarChange).not.toHaveBeenCalled();

    fireEvent.keyDown(document, { key: "Escape" });

    await waitFor(() => {
      expect(screen.queryByRole("dialog", { name: "Sidebar" })).toBeNull();
    });
    expect(onSidebarChange).not.toHaveBeenCalled();
    expect(document.activeElement).toBe(menuButton);
    setViewportWidth(1024);
  });
});
