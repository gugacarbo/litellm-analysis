import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createDbRepository } from "./db-repository";

const settingsStore = new Map<string, unknown>();

vi.mock("@lite-llm/llm-config-service", async () => {
  class SettingsRepository {
    constructor() {}

    async findByKey(key: string) {
      return settingsStore.has(key)
        ? {
            id: key,
            key,
            value: settingsStore.get(key),
            createdAt: new Date("2026-06-16T00:00:00.000Z"),
            updatedAt: new Date("2026-06-16T00:00:00.000Z"),
          }
        : null;
    }

    async upsert(key: string, value: unknown) {
      settingsStore.set(key, value);
      return {
        id: key,
        key,
        value,
        createdAt: new Date("2026-06-16T00:00:00.000Z"),
        updatedAt: new Date("2026-06-16T00:00:00.000Z"),
      };
    }
  }

  return {
    SettingsRepository,
    SETTING_KEYS: {
      DASHBOARD_AGENTS: "dashboard_agents",
      DASHBOARD_PLUGINS: "dashboard_plugins",
    },
  };
});

describe("DbAgentsRepository", () => {
  beforeEach(async () => {
    settingsStore.clear();
  });

  afterEach(async () => {
    settingsStore.clear();
  });

  async function createRepository() {
    return createDbRepository({ validateOnRead: false });
  }

  it("round-trips agents and plugins through dashboard settings keys", async () => {
    const repository = await createRepository();

    const config = {
      version: 2,
      categories: {},
      agents: {
        loom: {
          displayName: "Loom",
          icon: "L",
          description: "Agent",
          limits: { context: 200000, output: 32768 },
          model: "gpt-4",
          config: {},
        },
      },
      plugins: {
        opencode: {
          enabled: true,
          outputFile: "opencode.json",
          config: {},
          routing: { agents: {}, categories: {} },
        },
      },
    };

    await repository.write(config);
    const readBack = await repository.read();

    expect(readBack.agents?.loom?.model).toBe("gpt-4");
    expect(readBack.plugins?.opencode?.enabled).toBe(true);
  });

  it("reports exists when both dashboard settings are present", async () => {
    const repository = await createRepository();

    expect(await repository.exists()).toBe(false);

    await repository.write({
      version: 2,
      categories: {},
      agents: {
        test: {
          displayName: "Test",
          icon: "T",
          description: "description",
          limits: { context: 200000, output: 32768 },
          model: "test-model",
          config: {},
        },
      },
      plugins: {},
    });

    expect(await repository.exists()).toBe(true);
  });

  it("reports exists when both keys are present", async () => {
    const repository = await createRepository();

    await repository.write({
      version: 2,
      categories: {},
      agents: {},
      plugins: {},
    });

    expect(await repository.exists()).toBe(true);
  });
});
