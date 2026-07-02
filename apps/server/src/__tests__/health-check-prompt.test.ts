import type { ISettingsService } from "@lite-llm/model-proxy-registry-service";
import { describe, expect, it, vi } from "vitest";
import { resolveHealthCheckPrompt } from "../runtime/app-runtime";

function createSettingsService(
  impl: Partial<ISettingsService>,
): ISettingsService {
  return {
    getByKey: async () => null,
    list: async () => [],
    upsertByKey: async () => {
      throw new Error("not implemented");
    },
    deleteByKey: async () => false,
    getDefaultProvider: async () => null,
    setDefaultProvider: async () => undefined,
    deleteDefaultProvider: async () => false,
    getHealthCheckPrompt: async () => null,
    setHealthCheckPrompt: async () => undefined,
    getRouterSettings: async () => null,
    setRouterSettings: async () => undefined,
    ...impl,
  };
}

describe("resolveHealthCheckPrompt", () => {
  it("returns the default prompt when the database read fails", async () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const settingsService = createSettingsService({
      getHealthCheckPrompt: async () => {
        throw new Error("database unavailable");
      },
    });

    const prompt = await resolveHealthCheckPrompt(settingsService, {
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
