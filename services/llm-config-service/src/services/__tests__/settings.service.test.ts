import { beforeEach, describe, expect, it, vi } from "vitest";
import { SettingsRepository } from "../../repositories/settings-repository.js";
import { SettingsService } from "../settings.service.js";

type JsonValue = unknown;

type SettingRow = {
  id: string;
  key: string;
  value: JsonValue;
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
          create: { key: string; value: JsonValue };
          update: { value: JsonValue };
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
      delete: vi.fn(async ({ where }: { where: { key: string } }) => {
        const existing = rows.get(where.key);
        if (!existing) {
          const error = new Error("Not found") as Error & { code: string };
          error.code = "P2025";
          throw error;
        }
        rows.delete(where.key);
        return existing;
      }),
    },
  };
}

describe("SettingsService", () => {
  let prisma: ReturnType<typeof createSettingsPrismaMock>;
  let service: SettingsService;

  beforeEach(() => {
    prisma = createSettingsPrismaMock();
    service = new SettingsService({
      repository: new SettingsRepository(prisma as never),
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
