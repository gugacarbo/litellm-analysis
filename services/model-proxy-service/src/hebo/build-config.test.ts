import { beforeEach, describe, expect, it, vi } from "vitest";

const { resolveUpstreamTargetMock } = vi.hoisted(() => ({
  resolveUpstreamTargetMock: vi.fn(),
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

import { buildHeboGatewayConfig } from "./build-config";
import type { IModelService, IProviderService } from "@lite-llm/models-service";

function createTarget(modelName: string, overrides: Partial<Record<string, unknown>> = {}) {
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

function createDatabase(rows: Array<{
  isDefaultProvider: boolean;
  modelName: string;
  providerName: string | null;
}>) {
  return {
    modelProxyModel: {
      findMany: vi.fn().mockResolvedValue(rows),
    },
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
  });

  it("registers single-provider models under the bare name only", async () => {
    resolveUpstreamTargetMock.mockResolvedValue(
      createTarget("openai-main/gpt-4.1"),
    );

    const result = await buildHeboGatewayConfig({
      database: createDatabase([
        {
          modelName: "gpt-4.1",
          providerName: "openai-main",
          isDefaultProvider: false,
        },
      ]) as never,
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
      database: createDatabase([
        {
          modelName: "gpt-4.1",
          providerName: "deepseek-main",
          isDefaultProvider: false,
        },
        {
          modelName: "gpt-4.1",
          providerName: "openai-main",
          isDefaultProvider: true,
        },
      ]) as never,
      ...createServices(),
    });

    expect(Object.keys(result.models)).toEqual([
      "deepseek-main/gpt-4.1",
      "openai-main/gpt-4.1",
      "gpt-4.1",
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
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    resolveUpstreamTargetMock.mockImplementation(async ({ modelName }) =>
      createTarget(modelName),
    );

    const result = await buildHeboGatewayConfig({
      database: createDatabase([
        {
          modelName: "gpt-4.1",
          providerName: "deepseek-main",
          isDefaultProvider: false,
        },
        {
          modelName: "gpt-4.1",
          providerName: "openai-main",
          isDefaultProvider: false,
        },
      ]) as never,
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
});
