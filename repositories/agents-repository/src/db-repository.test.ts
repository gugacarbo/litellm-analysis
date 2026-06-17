import { SETTING_KEYS } from "@lite-llm/model-proxy-registry-service";
import { describe, expect, it } from "vitest";
import { createDbRepository } from "./db-repository";
import { createInMemoryPrisma } from "./test-helpers/in-memory-prisma";

describe("DbAgentsRepository", () => {
  it("round-trips agents and plugins through dashboard settings keys", async () => {
    const prisma = createInMemoryPrisma();
    const repository = createDbRepository({
      prisma: prisma as never,
      validateOnRead: false,
    });

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

    const agentsRow = await prisma.modelProxySetting.findUnique({
      where: { key: SETTING_KEYS.DASHBOARD_AGENTS },
    });
    const pluginsRow = await prisma.modelProxySetting.findUnique({
      where: { key: SETTING_KEYS.DASHBOARD_PLUGINS },
    });

    expect(agentsRow).not.toBeNull();
    expect(pluginsRow).not.toBeNull();
    expect((agentsRow?.value as { agents?: unknown }).agents).toBeDefined();
    expect(pluginsRow?.value).toBeDefined();
  });

  it("reports exists when both dashboard settings are present", async () => {
    const prisma = createInMemoryPrisma();
    const repository = createDbRepository({
      prisma: prisma as never,
      validateOnRead: false,
    });

    expect(await repository.exists()).toBe(false);

    await repository.write({
      version: 1,
      categories: {},
      agents: {},
      plugins: {},
    });

    expect(await repository.exists()).toBe(true);
  });
});
