import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SETTING_KEYS, SettingsRepository } from "@lite-llm/model-proxy-registry-service";
import { updateRouterAliasesInRegistry } from "@lite-llm/server/orchestration/router-settings";
import { createInMemoryPrisma } from "../../../repositories/agents-repository/src/test-helpers/in-memory-prisma";
import { importAgentsFromFile } from "./import-agents";
import { importPluginsFromFile } from "./import-plugins";
import { createEmptySummary } from "./types";

vi.mock("@lite-llm/model-proxy-repository", () => ({
  getModelProxyPrisma: vi.fn(),
}));

vi.mock("@lite-llm/model-proxy-registry-service", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@lite-llm/model-proxy-registry-service")>();

  return {
    ...actual,
    createRegistryServices: vi.fn(() => ({
      settingsService: { mocked: true },
    })),
  };
});

vi.mock("@lite-llm/server/orchestration/router-settings", () => ({
  updateRouterAliasesInRegistry: vi.fn().mockResolvedValue(undefined),
}));

describe("settings-import", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("imports agents idempotently without force", async () => {
    const prisma = createInMemoryPrisma();
    const dir = mkdtempSync(path.join(tmpdir(), "settings-import-"));
    const agentsFile = path.join(dir, "agents.jsonc");
    writeFileSync(
      agentsFile,
      JSON.stringify({
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
      }),
    );

    const summary = createEmptySummary();
    const flags = {
      dryRun: false,
      force: false,
    };

    await importAgentsFromFile(prisma as never, agentsFile, flags, summary);
    expect(summary.agents.inserted).toBe(1);

    await importAgentsFromFile(prisma as never, agentsFile, flags, summary);
    expect(summary.agents.skipped).toBe(1);
  });

  it("imports plugins and syncs model aliases into router settings", async () => {
    const prisma = createInMemoryPrisma();
    const dir = mkdtempSync(path.join(tmpdir(), "settings-import-plugins-"));
    const pluginsFile = path.join(dir, "plugins.jsonc");
    writeFileSync(
      pluginsFile,
      JSON.stringify({
        version: 2,
        plugins: {
          "model-alias": {
            enabled: true,
            outputFile: "model-alias.json",
            config: {
              $schema:
                "https://raw.githubusercontent.com/opensoft/lite-llm-analytics/main/services/agent-plugins/src/plugins/model-alias/schemas/model-alias.schema.json",
              model_group_alias: {
                fast: "openai-main/gpt-5",
              },
            },
            routing: {
              agents: {},
              categories: {},
            },
          },
        },
      }),
    );

    const summary = createEmptySummary();
    await importPluginsFromFile(
      prisma as never,
      pluginsFile,
      {
        dryRun: false,
        force: true,
      },
      summary,
    );

    expect(summary.plugins.inserted).toBe(1);

    const settings = new SettingsRepository(prisma as never);
    const pluginsRow = await settings.findByKey(SETTING_KEYS.DASHBOARD_PLUGINS);

    expect(pluginsRow?.value).toMatchObject({
      "model-alias": {
        enabled: true,
      },
    });
    expect(updateRouterAliasesInRegistry).toHaveBeenCalledWith(
      expect.anything(),
      {
        fast: "openai-main/gpt-5",
      },
    );
    expect(
      await settings.findByKey(SETTING_KEYS.ROUTER_SETTINGS),
    ).toBeNull();
  });
});
