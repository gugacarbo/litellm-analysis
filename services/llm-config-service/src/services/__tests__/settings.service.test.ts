import { beforeEach, describe, expect, it } from "vitest";
import { SettingsService } from "../settings.service.js";
import { createSettingsRepositoryMock } from "./in-memory-repositories.js";

describe("SettingsService", () => {
  let service: SettingsService;

  beforeEach(() => {
    const repository = createSettingsRepositoryMock();
    service = new SettingsService({
      repository: repository as never,
    });
  });

  it("gets and sets default provider", async () => {
    expect(await service.getDefaultProvider()).toBeNull();
    await service.setDefaultProvider("openai-main");
    expect(await service.getDefaultProvider()).toBe("openai-main");
  });

  it("deletes default provider", async () => {
    await service.setDefaultProvider("openai-main");
    expect(await service.deleteDefaultProvider()).toBe(true);
    expect(await service.getDefaultProvider()).toBeNull();
  });

  it("gets and sets health check prompt", async () => {
    await service.setHealthCheckPrompt("ping");
    expect(await service.getHealthCheckPrompt()).toBe("ping");
  });

  it("gets and sets router settings object", async () => {
    const payload = {
      model_group_alias: { fast: "gpt-fast" },
      __lite_llm_analytics: { managedModelGroupAliasKeys: ["fast"] },
    };
    await service.setRouterSettings(payload);
    expect(await service.getRouterSettings()).toEqual(payload);
  });

  it("rejects empty default provider", async () => {
    await expect(service.setDefaultProvider("   ")).rejects.toThrow(
      /non-empty/,
    );
  });

  it("rejects non-object router settings", async () => {
    await expect(service.setRouterSettings([] as never)).rejects.toThrow(
      /JSON object/,
    );
  });

  it("lists all settings rows", async () => {
    await service.setDefaultProvider("cred-a");
    await service.setHealthCheckPrompt("hello");
    const rows = await service.list();
    expect(rows).toHaveLength(2);
    expect(rows.map((row) => row.key).sort()).toEqual([
      "default_provider",
      "health_check_prompt",
    ]);
  });
});
