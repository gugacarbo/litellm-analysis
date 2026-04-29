import { afterEach, describe, expect, it, vi } from "vitest";

import { getBrowserLocale } from "@/lib/locale";

describe("locale detection", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the first browser locale when available", () => {
    vi.stubGlobal("navigator", {
      language: "pt-BR",
      languages: ["pt-BR", "en-US"],
    });

    expect(getBrowserLocale()).toBe("pt-BR");
  });

  it("falls back to navigator.language when languages is empty", () => {
    vi.stubGlobal("navigator", {
      language: "es-ES",
      languages: [],
    });

    expect(getBrowserLocale()).toBe("es-ES");
  });

  it("returns undefined when navigator is unavailable", () => {
    vi.unstubAllGlobals();
    vi.stubGlobal("navigator", undefined as never);

    expect(getBrowserLocale()).toBeUndefined();
  });
});
