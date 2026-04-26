import { describe, expect, it } from "vitest";
import { stripLitellmPrefix } from "../../src/utils/strip-prefix";

describe("stripLitellmPrefix", () => {
  it("should strip litellm/ prefix", () => {
    expect(stripLitellmPrefix("litellm/gpt-4o")).toBe("gpt-4o");
  });

  it("should return unchanged string if no prefix", () => {
    expect(stripLitellmPrefix("gpt-4o")).toBe("gpt-4o");
  });

  it("should handle empty string", () => {
    expect(stripLitellmPrefix("")).toBe("");
  });

  it("should handle prefix at start only", () => {
    expect(stripLitellmPrefix("litellm-litellm/gpt-4o")).toBe(
      "litellm-litellm/gpt-4o",
    );
  });

  it("should handle model names with special characters", () => {
    expect(stripLitellmPrefix("litellm/anthropic/claude-3-5-sonnet")).toBe(
      "anthropic/claude-3-5-sonnet",
    );
  });
});
