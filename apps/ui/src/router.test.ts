/** @vitest-environment node */

import { describe, expect, it, vi } from "vitest";

vi.mock("@lite-llm/database/client", () => ({
  getDb: vi.fn(),
}));

vi.mock("@/features/ui-preferences/server/ui-preferences.functions", () => ({
  getUiPreferences: vi.fn(),
}));

vi.mock("@/styles.css?url", () => ({ default: "/styles.css" }));

import { getRouter } from "./router";

describe("getRouter", () => {
  it("cria um QueryClient novo por router/request", () => {
    const first = getRouter();
    const second = getRouter();

    expect(first.options.context.queryClient).not.toBe(
      second.options.context.queryClient,
    );
  });
});
