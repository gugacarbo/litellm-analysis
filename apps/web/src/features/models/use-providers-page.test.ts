import { describe, expect, it } from "vitest";
import type { ModelWithStatus } from "@/shared/lib/api-client/models";
import { getDiscoveredProviderModelMatches } from "./use-providers-page";

function createModel(
  modelName: string,
  status: ModelWithStatus["status"],
  providerName?: string,
): ModelWithStatus {
  return {
    modelName,
    status,
    enabled: true,
    modelRoute: {
      modelName,
      ...(providerName ? { providerName } : {}),
    },
  };
}

describe("getDiscoveredProviderModelMatches", () => {
  it("matches provider discovery only against models configured for the same provider", () => {
    const matches = getDiscoveredProviderModelMatches(
      [
        createModel("gpt-4.1", "synced", "openai-main"),
        createModel("claude-3.7-sonnet", "synced", "anthropic-main"),
      ],
      {
        kind: "provider",
        providerName: "anthropic-main",
        provider: "anthropic",
      },
      [],
    );

    expect(matches.has("gpt-4.1")).toBe(false);
    expect(matches.get("claude-3.7-sonnet")).toBe("claude-3.7-sonnet");
  });

  it("falls back to provider-scoped config names when only the prefixed entry exists", () => {
    const matches = getDiscoveredProviderModelMatches(
      [createModel("groq-main/llama-3.3-70b", "config-only")],
      {
        kind: "provider",
        providerName: "groq-main",
        provider: "groq",
      },
      [],
    );

    expect(matches.get("llama-3.3-70b")).toBe("groq-main/llama-3.3-70b");
  });
});
