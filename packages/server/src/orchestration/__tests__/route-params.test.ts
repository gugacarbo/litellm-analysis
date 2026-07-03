import { describe, expect, it } from "vitest";
import {
  buildModelRouteFromSpec,
  getProviderNameFromParams,
  mergeModelRouteFromSpec,
  normalizeModelRoute,
  resolveModelProvider,
} from "../route-params";

describe("route-params", () => {
  it("reads the canonical providerName field only", () => {
    expect(
      getProviderNameFromParams({
        providerName: " openai-main ",
      }),
    ).toBe("openai-main");

    expect(
      getProviderNameFromParams({
        litellm_provider_name: "legacy-provider",
      }),
    ).toBeUndefined();
  });

  it("normalizes routes with canonical provider fallback", () => {
    expect(
      normalizeModelRoute(
        "gpt-test",
        {
          modelName: "old-name",
        },
        " openai-main ",
      ),
    ).toMatchObject({
      modelName: "gpt-test",
      providerName: "openai-main",
    });
  });

  it("builds and merges routes without reading deprecated provider aliases", () => {
    const built = buildModelRouteFromSpec(
      "gpt-test",
      {
        limits: { length: 128_000, maxOutput: 4096 },
        cost: { input: 0.000003, output: 0.000015 },
      },
      "openai-main",
    );

    expect(built).toMatchObject({
      modelName: "gpt-test",
      providerName: "openai-main",
      contextWindowSize: 128_000,
      maxOutputTokens: 4096,
    });

    const merged = mergeModelRouteFromSpec(
      "gpt-test",
      {
        limits: { length: 200_000, maxOutput: 8192 },
      },
      {
        modelName: "legacy-name",
        providerName: "anthropic-main",
      },
      "openai-main",
    );

    expect(merged).toMatchObject({
      modelName: "gpt-test",
      providerName: "anthropic-main",
      contextWindowSize: 200_000,
      maxOutputTokens: 8192,
    });
  });

  it("resolves providers from canonical params and fallback only", () => {
    expect(
      resolveModelProvider(
        {
          providerName: "anthropic-main",
        },
        "openai-main",
      ),
    ).toBe("anthropic-main");

    expect(
      resolveModelProvider(
        {
          litellm_provider_name: "legacy-provider",
        },
        "openai-main",
      ),
    ).toBe("openai-main");
  });
});
