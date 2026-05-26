import { describe, expect, it } from "vitest";
import type { PluginRouting, SystemAgent } from "../../../types";
import type { TransformContext } from "../../plugin";
import { createLitellmAliasPlugin } from "../factory/plugin.factory";

function buildOutput(
  plugin: ReturnType<typeof createLitellmAliasPlugin>,
  agents: SystemAgent[],
  routing: PluginRouting,
  context: TransformContext,
) {
  return plugin.handlers.build({
    agents,
    routing: routing as Parameters<
      ReturnType<typeof createLitellmAliasPlugin>["handlers"]["build"]
    >[0]["routing"],
    context,
  });
}

describe("createLitellmAliasPlugin", () => {
  const plugin = createLitellmAliasPlugin();

  const makeCtx = (
    overrides?: Partial<TransformContext>,
  ): TransformContext => ({
    allModels: {
      "gpt-4": {
        displayName: "GPT-4",
        limits: { length: 128000, maxOutput: 4096 },
        enabled: true,
      },
      "gpt-3.5": {
        displayName: "GPT-3.5",
        limits: { length: 16000, maxOutput: 4096 },
        enabled: true,
      },
    },
    globalFallbackModel: "gpt-3.5",
    litellmConfig: { baseUrl: "http://localhost:4000", apiKey: "key" },
    ...overrides,
  });

  const makeAgent = (
    id: string,
    overrides?: Partial<SystemAgent>,
  ): SystemAgent & { id: string } => ({
    id,
    displayName: id.charAt(0).toUpperCase() + id.slice(1),
    icon: "🤖",
    description: `Agent ${id}`,
    model: "gpt-4",
    limits: { context: 128000, output: 4096 },
    config: {},
    ...overrides,
  });

  it("should have correct metadata", () => {
    expect(plugin.manifest.id).toBe("litellm-alias");
    expect(plugin.manifest.displayName).toBe("LiteLLM Router Aliases");
    expect(plugin.manifest.output.fileName).toBe("litellm-aliases.json");
  });

  it("should generate aliases from agents with model", () => {
    const agents = [makeAgent("coder", { model: "gpt-4" })];
    const routing: PluginRouting = {
      enabled: true,
      outputFile: "litellm-aliases.json",
      routing: { agents: { coder: "coder" }, categories: {} },
    };
    const ctx = makeCtx();

    const output = buildOutput(plugin, agents, routing, ctx) as {
      model_group_alias: Record<string, string>;
    };

    expect(output.model_group_alias).toBeDefined();
    expect(Object.keys(output.model_group_alias).length).toBeGreaterThan(0);
  });

  it("should skip disabled models", () => {
    const agents = [makeAgent("coder", { model: "disabled-model" })];
    const routing: PluginRouting = {
      enabled: true,
      outputFile: "litellm-aliases.json",
      routing: { agents: { coder: "coder" }, categories: {} },
    };
    const ctx = makeCtx({
      allModels: {
        "disabled-model": {
          displayName: "Disabled",
          limits: { length: 128000, maxOutput: 4096 },
          enabled: false,
        },
      },
    });

    const output = buildOutput(plugin, agents, routing, ctx) as {
      model_group_alias: Record<string, string>;
    };

    const keys = Object.keys(output.model_group_alias);
    for (const key of keys) {
      expect(output.model_group_alias[key]).not.toBe("disabled-model");
    }
  });

  it("ignora campos de config fora do schema", () => {
    const agents = [makeAgent("coder")];
    const routing: PluginRouting = {
      enabled: true,
      outputFile: "litellm-aliases.json",
      config: {
        aliasPrefix: "prod:",
        includeAgents: true,
        includeCategories: true,
      },
      routing: { agents: { coder: "coder" }, categories: {} },
    };
    const ctx = makeCtx();

    const output = buildOutput(plugin, agents, routing, ctx) as {
      model_group_alias: Record<string, string>;
    };

    const keys = Object.keys(output.model_group_alias);
    expect(keys.some((k) => k.startsWith("prod:"))).toBe(false);
  });

  it("should include category aliases when configured", () => {
    const agents: SystemAgent[] = [];
    const routing: PluginRouting = {
      enabled: true,
      outputFile: "litellm-aliases.json",
      config: { includeAgents: false, includeCategories: true },
      routing: { agents: {}, categories: { reasoning: true } },
    };
    const ctx = makeCtx({
      allCategories: {
        reasoning: {
          description: "Reasoning tasks",
          model: "gpt-4",
          limits: { context: 128000, output: 4096 },
        },
      },
    });

    const output = buildOutput(plugin, agents, routing, ctx) as {
      model_group_alias: Record<string, string>;
    };

    const keys = Object.keys(output.model_group_alias);
    expect(keys.some((k) => k.startsWith("reasoning"))).toBe(true);
  });

  it("should validate output correctly", () => {
    const validOutput = {
      $schema: "https://example.com/schema.json",
      model_group_alias: { "test/alias": "real-model" },
    };
    expect(plugin.handlers.validate?.(validOutput)).toBe(true);

    const invalidOutput = { not_alias: true };
    expect(plugin.handlers.validate?.(invalidOutput as never)).toBe(false);
  });

  it("should not throw when afterExport with no dbWriter", async () => {
    const pluginNoDb = createLitellmAliasPlugin();
    await expect(
      pluginNoDb.handlers.afterExport?.({
        $schema: "https://example.com/schema.json",
        model_group_alias: {},
      }),
    ).resolves.toBeUndefined();
  });
});
