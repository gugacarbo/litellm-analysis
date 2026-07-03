import { randomUUID } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { PluginExecutionError } from "../errors";
import { createPluginRegistry } from "../plugin-registry";
import type { PluginDefinition } from "../sdk";
import type { AgentsRepositoryLike } from "../types";

function createUniqueOutputDir(): string {
  return `/tmp/test-registry-v2-output-${randomUUID()}`;
}

function createMockRepository(): AgentsRepositoryLike {
  return {
    read: vi.fn().mockResolvedValue({
      version: 2,
      agents: {
        worker: {
          displayName: "Worker",
          icon: "⚒️",
          description: "does work",
          model: "gpt-5",
          config: {},
        },
      },
      categories: {},
      plugins: {
        "test-v2": {
          enabled: true,
          outputFile: "test-v2.json",
          routing: { agents: {}, categories: {} },
          config: {},
        },
      },
    }),
    write: vi.fn(),
  };
}

function createTestPlugin(
  overrides: Partial<
    PluginDefinition<
      "test-v2",
      Record<string, unknown>,
      Record<string, unknown>
    >["handlers"]
  > = {},
): PluginDefinition<
  "test-v2",
  Record<string, unknown>,
  Record<string, unknown>
> {
  return {
    manifest: {
      id: "test-v2",
      displayName: "Test V2",
      version: 2,
      output: { fileName: "test-v2.json" },
      $schema: "https://example.com/test-v2.schema.json",
      internalAgents: [],
    },
    handlers: {
      build: overrides.build ?? (() => ({ ok: true })),
      validate: overrides.validate,
      afterExport: overrides.afterExport,
    },
  };
}

describe("PluginRegistryV2", () => {
  it("exposes internal agents and JSON schema from the current registry API", () => {
    const repository = createMockRepository();
    const registry = createPluginRegistry({
      repository,
      outputDir: createUniqueOutputDir(),
      catalog: [createTestPlugin()],
    });

    expect(registry.getInternalAgents("test-v2")).toEqual([]);
    expect(registry.getJsonSchema("opencode")).toMatchObject({
      type: "object",
    });
  });

  it("registra catálogo e exporta plugin habilitado", async () => {
    const repository = createMockRepository();
    const registry = createPluginRegistry({
      repository,
      outputDir: createUniqueOutputDir(),
      catalog: [createTestPlugin()],
    });

    registry.loadFromConfig({
      "test-v2": {
        enabled: true,
        outputFile: "test-v2.json",
        routing: { agents: {}, categories: {} },
      },
    });

    await expect(registry.exportOne("test-v2")).resolves.toBeUndefined();
  });

  it("encapsula erro de validação com estágio", async () => {
    const repository = createMockRepository();
    const registry = createPluginRegistry({
      repository,
      outputDir: createUniqueOutputDir(),
      catalog: [
        createTestPlugin({
          validate: () => false,
        }),
      ],
    });

    registry.loadFromConfig({
      "test-v2": {
        enabled: true,
        outputFile: "test-v2.json",
        routing: { agents: {}, categories: {} },
      },
    });

    try {
      await registry.exportOne("test-v2");
      throw new Error("expected exportOne to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(PluginExecutionError);
      const pluginError = error as PluginExecutionError;
      expect(pluginError.pluginId).toBe("test-v2");
      expect(pluginError.stage).toBe("validate");
    }
  });

  it("encapsula erro de afterExport com estágio", async () => {
    const repository = createMockRepository();
    const registry = createPluginRegistry({
      repository,
      outputDir: createUniqueOutputDir(),
      catalog: [
        createTestPlugin({
          afterExport: async () => {
            throw new Error("boom");
          },
        }),
      ],
    });

    registry.loadFromConfig({
      "test-v2": {
        enabled: true,
        outputFile: "test-v2.json",
        routing: { agents: {}, categories: {} },
      },
    });

    try {
      await registry.exportOne("test-v2");
      throw new Error("expected exportOne to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(PluginExecutionError);
      const pluginError = error as PluginExecutionError;
      expect(pluginError.pluginId).toBe("test-v2");
      expect(pluginError.stage).toBe("afterExport");
    }
  });
});
