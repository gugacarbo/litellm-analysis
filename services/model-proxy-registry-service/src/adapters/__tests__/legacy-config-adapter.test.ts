import type { Prisma } from "@lite-llm/model-proxy-repository";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsRepository } from "../../repositories/settings-repository.js";
import { SettingsService } from "../../services/settings.service.js";
import {
  buildSettingsRows,
  extractDefaultCredential,
  extractHealthCheckPrompt,
  importLegacyConfig,
  readLegacyConfigSource,
} from "../legacy-config-adapter.js";

type SettingRow = {
  id: string;
  key: string;
  value: Prisma.JsonValue;
  createdAt: Date;
  updatedAt: Date;
};

function createSettingsPrismaMock() {
  const rows = new Map<string, SettingRow>();
  let idCounter = 1;

  return {
    modelProxySetting: {
      findUnique: vi.fn(async ({ where }: { where: { key: string } }) => {
        return rows.get(where.key) ?? null;
      }),
      findMany: vi.fn(async () =>
        [...rows.values()].sort((a, b) => a.key.localeCompare(b.key)),
      ),
      upsert: vi.fn(
        async ({
          where,
          create,
          update,
        }: {
          where: { key: string };
          create: { key: string; value: Prisma.JsonValue };
          update: { value: Prisma.JsonValue };
        }) => {
          const existing = rows.get(where.key);
          const now = new Date();
          if (existing) {
            const updated: SettingRow = {
              ...existing,
              value: update.value,
              updatedAt: now,
            };
            rows.set(where.key, updated);
            return updated;
          }
          const created: SettingRow = {
            id: `setting_${idCounter++}`,
            key: create.key,
            value: create.value,
            createdAt: now,
            updatedAt: now,
          };
          rows.set(create.key, created);
          return created;
        },
      ),
    },
  };
}

describe("legacy-config-adapter", () => {
  describe("extractors", () => {
    it("extracts default credential from param_value", () => {
      expect(
        extractDefaultCredential({ default_credential: "openai-main" }),
      ).toBe("openai-main");
      expect(extractDefaultCredential({ default_credential: "  " })).toBeNull();
      expect(extractDefaultCredential(null)).toBeNull();
    });

    it("extracts health check prompt from general_settings", () => {
      expect(
        extractHealthCheckPrompt({ health_check_prompt: "  ping  " }),
      ).toBe("ping");
      expect(extractHealthCheckPrompt({ health_check_prompt: 1 })).toBeNull();
      expect(extractHealthCheckPrompt({})).toBeNull();
    });
  });

  describe("readLegacyConfigSource", () => {
    it("reads via injected query function", async () => {
      const query = vi.fn(async (paramName: string) => {
        if (paramName === "default_credential") {
          return { param_value: { default_credential: "cred-a" } };
        }
        if (paramName === "general_settings") {
          return { param_value: { health_check_prompt: "hello" } };
        }
        if (paramName === "router_settings") {
          return {
            param_value: {
              model_group_alias: { fast: "gpt-fast" },
            },
          };
        }
        return undefined;
      });

      const source = await readLegacyConfigSource(query);
      expect(source).toEqual({
        defaultCredential: "cred-a",
        healthCheckPrompt: "hello",
        routerSettings: { model_group_alias: { fast: "gpt-fast" } },
      });
    });

    it("builds settings rows without unrelated general_settings fields", () => {
      const rows = buildSettingsRows({
        defaultCredential: "cred-a",
        healthCheckPrompt: "ping",
        routerSettings: {
          model_group_alias: { fast: "gpt-fast" },
          __lite_llm_analytics: { managedModelGroupAliasKeys: ["fast"] },
        },
      });

      expect(rows).toEqual([
        {
          key: "default_credential",
          value: { default_credential: "cred-a" },
        },
        {
          key: "health_check_prompt",
          value: { health_check_prompt: "ping" },
        },
        {
          key: "router_settings",
          value: {
            model_group_alias: { fast: "gpt-fast" },
            __lite_llm_analytics: { managedModelGroupAliasKeys: ["fast"] },
          },
        },
      ]);
    });
  });

  describe("importLegacyConfig", () => {
    let service: SettingsService;

    beforeEach(() => {
      const prisma = createSettingsPrismaMock();
      service = new SettingsService({
        repository: new SettingsRepository(prisma as never),
      });
    });

    it("upserts all settings from mocked analytics reader", async () => {
      const reader = {
        getDefaultCredential: vi.fn(async () => "openai-main"),
        getHealthCheckPrompt: vi.fn(async () => "ping"),
        getRouterSettings: vi.fn(async () => ({
          model_group_alias: { fast: "gpt-fast" },
        })),
      };

      const summary = await importLegacyConfig({
        settingsService: service,
        reader,
      });

      expect(summary).toMatchObject({
        inserted: 3,
        updated: 0,
        skipped: 0,
        errors: [],
      });
      expect(await service.getDefaultCredential()).toBe("openai-main");
      expect(await service.getHealthCheckPrompt()).toBe("ping");
      expect(await service.getRouterSettings()).toEqual({
        model_group_alias: { fast: "gpt-fast" },
      });
    });

    it("skips existing settings unless force is set", async () => {
      await service.setDefaultCredential("existing");

      const summary = await importLegacyConfig({
        settingsService: service,
        reader: {
          getDefaultCredential: vi.fn(async () => "openai-main"),
          getHealthCheckPrompt: vi.fn(async () => null),
          getRouterSettings: vi.fn(async () => null),
        },
      });

      expect(summary.skipped).toBe(1);
      expect(summary.inserted).toBe(0);
      expect(await service.getDefaultCredential()).toBe("existing");
    });

    it("supports dry-run without writing", async () => {
      const summary = await importLegacyConfig({
        settingsService: service,
        dryRun: true,
        reader: {
          getDefaultCredential: vi.fn(async () => "openai-main"),
          getHealthCheckPrompt: vi.fn(async () => null),
          getRouterSettings: vi.fn(async () => null),
        },
      });

      expect(summary.inserted).toBe(1);
      expect(await service.getDefaultCredential()).toBeNull();
    });
  });
});
