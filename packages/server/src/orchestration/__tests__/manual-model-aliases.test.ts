import type {
  ISettingsService,
  RouterSettingsValue,
} from "@lite-llm/model-proxy-registry-service";
import { describe, expect, it, vi } from "vitest";
import {
  listBlockingManualAliases,
  listManualAliasesForTarget,
  listManualModelAliases,
  replaceManualAliasesForTarget,
  retargetManualAliases,
} from "../index";

function createSettingsService(
  initialSettings: RouterSettingsValue | null,
): ISettingsService & {
  getStoredRouterSettings: () => RouterSettingsValue | null;
  setRouterSettingsMock: ReturnType<typeof vi.fn>;
} {
  let routerSettings = initialSettings;
  const setRouterSettingsMock = vi.fn(
    async (value: RouterSettingsValue): Promise<void> => {
      routerSettings = value;
    },
  );

  return {
    getByKey: async () => null,
    list: async () => [],
    upsertByKey: async () => {
      throw new Error("not implemented");
    },
    deleteByKey: async () => false,
    getDefaultCredential: async () => null,
    setDefaultCredential: async () => undefined,
    deleteDefaultCredential: async () => false,
    getHealthCheckPrompt: async () => null,
    setHealthCheckPrompt: async () => undefined,
    getRouterSettings: async () => routerSettings,
    setRouterSettings: setRouterSettingsMock,
    getStoredRouterSettings: () => routerSettings,
    setRouterSettingsMock,
  };
}

describe("manual model aliases orchestration", () => {
  it("lists manual aliases globally and for one target model", async () => {
    const settingsService = createSettingsService({
      model_group_alias: {
        generated: "gpt-generated",
        beta: "model-b",
        alpha: "model-a",
      },
      __lite_llm_analytics: {
        manualModelAliasKeys: ["beta", "alpha"],
        managedModelGroupAliasKeys: ["generated"],
      },
    });

    await expect(listManualModelAliases(settingsService)).resolves.toEqual([
      { alias: "alpha", targetModel: "model-a" },
      { alias: "beta", targetModel: "model-b" },
    ]);
    await expect(
      listManualAliasesForTarget(settingsService, "model-b"),
    ).resolves.toEqual(["beta"]);
  });

  it("replaces one target's manual aliases without clobbering managed data", async () => {
    const settingsService = createSettingsService({
      routing_strategy: "latency-based-routing",
      model_group_alias: {
        generated: "plugin-target",
        beta: "model-a",
        shared: "model-b",
      },
      __lite_llm_analytics: {
        manualModelAliasKeys: ["shared", "beta", "beta", "missing"],
        managedModelGroupAliasKeys: ["generated"],
      },
    });

    const updated = await replaceManualAliasesForTarget(
      settingsService,
      "model-a",
      [" zeta ", "alpha", "alpha"],
    );

    expect(updated).toEqual([
      { alias: "alpha", targetModel: "model-a" },
      { alias: "shared", targetModel: "model-b" },
      { alias: "zeta", targetModel: "model-a" },
    ]);
    expect(settingsService.getStoredRouterSettings()).toEqual({
      routing_strategy: "latency-based-routing",
      model_group_alias: {
        generated: "plugin-target",
        shared: "model-b",
        alpha: "model-a",
        zeta: "model-a",
      },
      __lite_llm_analytics: {
        manualModelAliasKeys: ["alpha", "shared", "zeta"],
        managedModelGroupAliasKeys: ["generated"],
      },
    });
    expect(settingsService.setRouterSettingsMock).toHaveBeenCalledOnce();
  });

  it("ignores incoming manual aliases that collide with managed ownership", async () => {
    const settingsService = createSettingsService({
      model_group_alias: {
        generated: "plugin-target",
        beta: "model-a",
      },
      __lite_llm_analytics: {
        manualModelAliasKeys: ["beta"],
        managedModelGroupAliasKeys: ["generated"],
      },
    });

    const updated = await replaceManualAliasesForTarget(
      settingsService,
      "model-a",
      ["generated", "alpha"],
    );

    expect(updated).toEqual([{ alias: "alpha", targetModel: "model-a" }]);
    expect(settingsService.getStoredRouterSettings()).toEqual({
      model_group_alias: {
        generated: "plugin-target",
        alpha: "model-a",
      },
      __lite_llm_analytics: {
        manualModelAliasKeys: ["alpha"],
        managedModelGroupAliasKeys: ["generated"],
      },
    });
  });

  it("cleans duplicate cross-owner metadata so managed ownership wins", async () => {
    const settingsService = createSettingsService({
      model_group_alias: {
        generated: "plugin-target",
        alpha: "model-a",
        beta: "model-b",
      },
      __lite_llm_analytics: {
        manualModelAliasKeys: ["generated", "alpha", "generated"],
        managedModelGroupAliasKeys: ["generated"],
      },
    });

    await expect(listManualModelAliases(settingsService)).resolves.toEqual([
      { alias: "alpha", targetModel: "model-a" },
    ]);

    const updated = await replaceManualAliasesForTarget(
      settingsService,
      "model-a",
      ["alpha"],
    );

    expect(updated).toEqual([{ alias: "alpha", targetModel: "model-a" }]);
    expect(settingsService.getStoredRouterSettings()).toEqual({
      model_group_alias: {
        generated: "plugin-target",
        beta: "model-b",
        alpha: "model-a",
      },
      __lite_llm_analytics: {
        manualModelAliasKeys: ["alpha"],
        managedModelGroupAliasKeys: ["generated"],
      },
    });
  });

  it("retargets only manual aliases during model rename", async () => {
    const settingsService = createSettingsService({
      model_group_alias: {
        generated: "model-a",
        alpha: "model-a",
        beta: "model-b",
      },
      __lite_llm_analytics: {
        manualModelAliasKeys: ["beta", "alpha"],
        managedModelGroupAliasKeys: ["generated"],
      },
    });

    await retargetManualAliases(settingsService, "model-a", "model-a-renamed");

    expect(settingsService.getStoredRouterSettings()).toEqual({
      model_group_alias: {
        generated: "model-a",
        alpha: "model-a-renamed",
        beta: "model-b",
      },
      __lite_llm_analytics: {
        manualModelAliasKeys: ["alpha", "beta"],
        managedModelGroupAliasKeys: ["generated"],
      },
    });
  });

  it("lists manual aliases that block deleting a target model", async () => {
    const settingsService = createSettingsService({
      model_group_alias: {
        gamma: "model-a",
        alpha: "model-a",
        generated: "model-a",
        beta: "model-b",
      },
      __lite_llm_analytics: {
        manualModelAliasKeys: ["gamma", "beta", "alpha"],
        managedModelGroupAliasKeys: ["generated"],
      },
    });

    await expect(
      listBlockingManualAliases(settingsService, "model-a"),
    ).resolves.toEqual(["alpha", "gamma"]);
  });
});
