import { describe, expect, it } from "vitest";
import { generateLitellmAliases } from "../../src/alias/generate";

describe("generateLitellmAliases", () => {
  it("should generate primary model alias", () => {
    const result = generateLitellmAliases("sisyphus", "gpt-4o");
    expect(result).toEqual({
      "sisyphus/gpt-5.5": "gpt-4o",
    });
  });

  it("should strip litellm/ prefix from model", () => {
    const result = generateLitellmAliases("sisyphus", "litellm/gpt-4o");
    expect(result["sisyphus/gpt-5.5"]).toBe("gpt-4o");
  });

  it("should generate fallback aliases from fallback_models", () => {
    // Note: gpt-5.1 uses the last fallback model when no globalFallbackModel
    const result = generateLitellmAliases("sisyphus", "gpt-4o", [
      "gpt-4o-mini",
      "claude-3-haiku",
      "gemini-flash",
    ]);
    expect(result).toEqual({
      "sisyphus/gpt-5.5": "gpt-4o",
      "sisyphus/gpt-5.4": "gpt-4o-mini",
      "sisyphus/gpt-5.3": "claude-3-haiku",
      "sisyphus/gpt-5.2": "gemini-flash",
      "sisyphus/gpt-5.1": "gemini-flash", // last fallback reused for gpt-5.1
    });
  });

  it("should limit fallback aliases to 3 (plus gpt-5.1 from last fallback)", () => {
    const result = generateLitellmAliases("sisyphus", "gpt-4o", [
      "model-a",
      "model-b",
      "model-c",
      "model-d",
      "model-e",
    ]);
    // primary + 3 fallbacks + gpt-5.1 (reuse last fallback)
    expect(Object.keys(result)).toHaveLength(5);
    expect(result["sisyphus/gpt-5.4"]).toBe("model-a");
    expect(result["sisyphus/gpt-5.3"]).toBe("model-b");
    expect(result["sisyphus/gpt-5.2"]).toBe("model-c");
    expect(result["sisyphus/gpt-5.1"]).toBe("model-e"); // last of 5 fallbacks reused
  });

  it("should use global fallback for gpt-5.1 slot when provided", () => {
    const result = generateLitellmAliases(
      "sisyphus",
      "gpt-4o",
      ["gpt-4o-mini", "claude-3-haiku"],
      "gemini-pro",
    );
    expect(result["sisyphus/gpt-5.1"]).toBe("gemini-pro");
  });

  it("should fill missing fallback slots with global fallback", () => {
    const result = generateLitellmAliases(
      "sisyphus",
      "gpt-4o",
      ["gpt-4o-mini"],
      "gemini-pro",
    );
    expect(result).toEqual({
      "sisyphus/gpt-5.5": "gpt-4o",
      "sisyphus/gpt-5.4": "gpt-4o-mini",
      "sisyphus/gpt-5.3": "gemini-pro",
      "sisyphus/gpt-5.2": "gemini-pro",
      "sisyphus/gpt-5.1": "gemini-pro",
    });
  });

  it("should use last fallback for gpt-5.1 when no global fallback", () => {
    const result = generateLitellmAliases("sisyphus", "gpt-4o", [
      "gpt-4o-mini",
      "claude-3-haiku",
    ]);
    expect(result["sisyphus/gpt-5.1"]).toBe("claude-3-haiku");
  });

  it("should handle empty model", () => {
    const result = generateLitellmAliases("sisyphus", "");
    expect(result).toEqual({});
  });

  it("should use global fallback when primary model is empty", () => {
    const result = generateLitellmAliases(
      "sisyphus",
      "",
      undefined,
      "gemini-pro",
    );
    expect(result).toEqual({
      "sisyphus/gpt-5.5": "gemini-pro",
      "sisyphus/gpt-5.4": "gemini-pro",
      "sisyphus/gpt-5.3": "gemini-pro",
      "sisyphus/gpt-5.2": "gemini-pro",
      "sisyphus/gpt-5.1": "gemini-pro",
    });
  });

  it("should handle undefined fallback_models", () => {
    const result = generateLitellmAliases("sisyphus", "gpt-4o", undefined);
    expect(result["sisyphus/gpt-5.5"]).toBe("gpt-4o");
    expect(result["sisyphus/gpt-5.1"]).toBeUndefined();
  });

  it("should handle empty fallback_models array", () => {
    const result = generateLitellmAliases("sisyphus", "gpt-4o", []);
    expect(result["sisyphus/gpt-5.5"]).toBe("gpt-4o");
    expect(result["sisyphus/gpt-5.1"]).toBeUndefined();
  });

  it("should handle category keys", () => {
    const result = generateLitellmAliases("visual-engineering", "gpt-4o", [
      "gpt-4o-mini",
    ]);
    expect(result["visual-engineering/gpt-5.5"]).toBe("gpt-4o");
    expect(result["visual-engineering/gpt-5.4"]).toBe("gpt-4o-mini");
  });
});
