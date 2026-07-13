/** @vitest-environment jsdom */

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ThemeControl } from "./theme-control";

afterEach(cleanup);

describe("ThemeControl", () => {
  it("offers only light and dark, then reports a recoverable preference failure", async () => {
    const onThemeChange = vi
      .fn<() => Promise<void>>()
      .mockRejectedValue(new Error("network unavailable"));

    render(<ThemeControl theme="dark" onThemeChange={onThemeChange} />);

    const choices = screen.getAllByRole("button");
    expect(choices).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Light theme" })).toBeTruthy();
    expect(
      screen
        .getByRole("button", { name: "Dark theme" })
        .getAttribute("aria-pressed"),
    ).toBe("true");

    fireEvent.click(screen.getByRole("button", { name: "Light theme" }));

    expect(onThemeChange).toHaveBeenCalledWith("light");
    expect((await screen.findByRole("alert")).textContent).toBe(
      "Could not save theme preference. Try again.",
    );
    expect(
      screen
        .getByRole("button", { name: "Dark theme" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
  });
});
