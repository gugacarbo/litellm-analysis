import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createInMemoryPrisma } from "../../../repositories/agents-repository/src/test-helpers/in-memory-prisma";
import { importAgentsFromFile } from "./import-agents";
import { importModelsFromFile } from "./import-models";
import { createEmptySummary } from "./types";

vi.mock("@lite-llm/model-proxy-repository", () => ({
  getModelProxyPrisma: vi.fn(),
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
      skipMissingModels: true,
      createStubs: false,
    };

    await importAgentsFromFile(prisma as never, agentsFile, flags, summary);
    expect(summary.agents.inserted).toBe(1);

    await importAgentsFromFile(prisma as never, agentsFile, flags, summary);
    expect(summary.agents.skipped).toBe(1);
  });

  it("imports models and providers skipping local-proxy provider", async () => {
    const prisma = createInMemoryPrisma();
    const dir = mkdtempSync(path.join(tmpdir(), "settings-import-models-"));
    const modelsFile = path.join(dir, "models.jsonc");
    writeFileSync(
      modelsFile,
      JSON.stringify({
        version: 1,
        provider: {
          "local-proxy": {
            name: "Local Model Proxy",
            baseUrl: "http://localhost:3008/v1",
            defaultProvider: "router-main",
            apiKey: "env:MODEL_PROXY_API_KEY",
          },
          openai: {
            name: "OpenAI",
            adapter: "openai-compatible",
            baseUrl: "https://api.openai.com/v1",
            defaultProvider: "openai-main",
            apiKey: "env:OPENAI_API_KEY",
          },
        },
        models: {
          "gpt-4": {
            enabled: true,
            displayName: "GPT-4",
            limits: { length: 128000, maxOutput: 4096 },
            thinking: { levels: ["low"] },
          },
        },
      }),
    );

    const summary = createEmptySummary();
    await importModelsFromFile(
      prisma as never,
      modelsFile,
      { agents: {}, categories: {} },
      {
        dryRun: false,
        force: true,
        skipMissingModels: true,
        createStubs: false,
      },
      summary,
    );

    expect(summary.models.inserted).toBe(1);
    expect(summary.providers.inserted).toBe(1);
    expect(summary.settings.inserted).toBe(1);

    const localProxyProvider = await prisma.modelProxyProvider.findUnique({
      where: { name: "router-main" },
    });
    expect(localProxyProvider).toBeNull();

    const openaiProvider = await prisma.modelProxyProvider.findUnique({
      where: { name: "openai-main" },
    });
    expect(openaiProvider?.secretRef).toBe("OPENAI_API_KEY");
  });
});
