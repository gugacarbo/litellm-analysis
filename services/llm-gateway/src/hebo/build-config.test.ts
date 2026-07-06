import { beforeEach, describe, expect, it, vi } from "vitest";

const { resolveUpstreamTargetMock, dbSelectMock } = vi.hoisted(() => ({
  resolveUpstreamTargetMock: vi.fn(),
  dbSelectMock: vi.fn(),
}));

vi.mock("@ai-sdk/openai-compatible", () => ({
  createOpenAICompatible: vi.fn((options: Record<string, unknown>) => options),
}));

vi.mock("@hebo-ai/gateway", () => ({
  defineModelCatalog: vi.fn((catalog: Record<string, unknown>) => catalog),
  withCanonicalIds: vi.fn(
    (
      provider: Record<string, unknown>,
      options: { mapping: Record<string, string> },
    ) => ({
      ...provider,
      mapping: options.mapping,
    }),
  ),
}));

vi.mock("@lite-llm/database/client", () => ({
  db: {
    select: dbSelectMock,
  },
}));

vi.mock("../resolver/upstream-provider", () => ({
  parseProviderModel: (rawModel: string) => {
    const trimmed = rawModel.trim();
    const slashIndex = trimmed.indexOf("/");

    if (slashIndex === -1 || slashIndex === 0) {
      return { bareModelName: trimmed };
    }

    const providerPrefix = trimmed.slice(0, slashIndex);
    const bareModelName = trimmed.slice(slashIndex + 1);

    if (!bareModelName) {
      return { bareModelName: trimmed };
    }

    return { providerPrefix, bareModelName };
  },
  resolveUpstreamTarget: resolveUpstreamTargetMock,
}));

import type { IModelService, IProviderService } from "@lite-llm/models-service";
import { buildHeboGatewayConfig } from "./build-config";

function createTarget(
  modelName: string,
  overrides: Partial<Record<string, unknown>> = {},
) {
  const [, bareModelName = modelName] = modelName.split("/", 2);

  return {
    authMode: "bearer" as const,
    cost: {},
    displayName: `Display ${bareModelName}`,
    model: modelName,
    ownedBy: "openai",
    upstreamBaseUrl: `https://${modelName.replace("/", "-")}.example.com/v1`,
    upstreamHeaders: {
      authorization: `Bearer token-${modelName.replace("/", "-")}`,
    },
    upstreamModel: `${bareModelName}-upstream`,
    ...overrides,
  };
}

function createServices() {
  return {
    modelsService: {
      getAll: vi.fn().mockResolvedValue({}),
    } as unknown as IModelService,
    providerService: {
      getAll: vi.fn().mockResolvedValue({}),
    } as unknown as IProviderService,
  };
}

describe("buildHeboGatewayConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    dbSelectMock.mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() =>
            Promise.resolve([
              { modelName: "gpt-4.1", providerName: "openai-main", isDefaultProvider: true },
              { modelName: "gpt-4.1", providerName: "deepseek-main", isDefaultProvider: false },
            ]),
          ),
        })),
      })),
    });
  });

  it("registers single-provider models under the bare name only", async () => {
    dbSelectMock.mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() =>
            Promise.resolve([
              { modelName: "gpt-4.1", providerName: "openai-main", isDefaultProvider: true },
            ]),
          ),
        })),
      })),
    });
    resolveUpstreamTargetMock.mockResolvedValue(
      createTarget("openai-main/gpt-4.1"),
    );

    const result = await buildHeboGatewayConfig({
      ...createServices(),
    });

    expect(resolveUpstreamTargetMock).toHaveBeenCalledWith(
      expect.objectContaining({ modelName: "openai-main/gpt-4.1" }),
    );
    expect(Object.keys(result.models)).toEqual(["gpt-4.1"]);
    expect(result.targetsByModel.has("gpt-4.1")).toBe(true);
    expect(result.targetsByModel.has("openai-main/gpt-4.1")).toBe(false);
    expect(result.providerByModel.has("openai-main/gpt-4.1")).toBe(false);
  });

  it("registers multi-provider models under provider/model and adds the bare alias for the default provider", async () => {
    resolveUpstreamTargetMock.mockImplementation(async ({ modelName }) =>
      createTarget(
        modelName,
        modelName === "openai-main/gpt-4.1"
          ? { displayName: "GPT 4.1 OpenAI" }
          : { displayName: "GPT 4.1 DeepSeek" },
      ),
    );

    const result = await buildHeboGatewayConfig({
      ...createServices(),
    });

    expect(Object.keys(result.models)).toEqual([
      "openai-main/gpt-4.1",
      "gpt-4.1",
      "deepseek-main/gpt-4.1",
    ]);
    expect(result.targetsByModel.get("gpt-4.1")?.model).toBe(
      "openai-main/gpt-4.1",
    );
    expect(result.providerByModel.get("gpt-4.1")).toBe(
      result.providerByModel.get("openai-main/gpt-4.1"),
    );
    expect(result.providerByModel.get("gpt-4.1")).not.toBe(
      result.providerByModel.get("deepseek-main/gpt-4.1"),
    );
  });

  it("warns and omits the bare alias when an ambiguous model has no default provider", async () => {
    dbSelectMock.mockReturnValue({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          orderBy: vi.fn(() =>
            Promise.resolve([
              { modelName: "gpt-4.1", providerName: "deepseek-main", isDefaultProvider: false },
              { modelName: "gpt-4.1", providerName: "openai-main", isDefaultProvider: false },
            ]),
          ),
        })),
      })),
    });
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    resolveUpstreamTargetMock.mockImplementation(async ({ modelName }) =>
      createTarget(modelName),
    );

    const result = await buildHeboGatewayConfig({
      ...createServices(),
    });

    expect(Object.keys(result.models)).toEqual([
      "deepseek-main/gpt-4.1",
      "openai-main/gpt-4.1",
    ]);
    expect(result.models["gpt-4.1"]).toBeUndefined();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Ambiguous model "gpt-4.1"'),
    );
  });

  it("throws a detailed error when enabled models exist but none can resolve an upstream provider", async () => {
    resolveUpstreamTargetMock.mockRejectedValue(
      new Error("No upstream API key configured for model \"gpt-4.1\""),
    );

    await expect(
      buildHeboGatewayConfig({
        ...createServices(),
      }),
    ).rejects.toThrow(
      /Failed to build Hebo gateway config: no resolvable upstream providers/,
    );

    await expect(
      buildHeboGatewayConfig({
        ...createServices(),
      }),
    ).rejects.toThrow(
      /openai-main\/gpt-4\.1: No upstream API key configured/,
    );
  });
});
