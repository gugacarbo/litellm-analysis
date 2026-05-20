import { describe, expect, it, vi } from "vitest";
import { resolveHealthCheckPrompt } from "../runtime/app-runtime";

describe("resolveHealthCheckPrompt", () => {
  it("returns the default prompt when the database read fails", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const prompt = await resolveHealthCheckPrompt({
      getHealthCheckPrompt: async () => {
        throw new Error("database unavailable");
      },
    });

    expect(prompt).toBe(
      "Respond with ONLY your model name. Example: gpt-5.3-codex",
    );
    expect(warnSpy).toHaveBeenCalledOnce();

    warnSpy.mockRestore();
  });
});
