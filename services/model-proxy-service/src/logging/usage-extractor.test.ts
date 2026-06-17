import { describe, expect, it } from "vitest";
import {
  estimateUsageFromContent,
  extractUsage,
  mergeUsage,
  readUsageFromStreamBuffer,
} from "./usage-extractor";

describe("usage-extractor", () => {
  it("extracts standard OpenAI usage fields", () => {
    expect(
      extractUsage({
        usage: {
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
          cached_tokens: 2,
          completion_tokens_details: {
            reasoning_tokens: 3,
          },
        },
      }),
    ).toEqual({
      inputTokens: 10,
      outputTokens: 5,
      totalTokens: 15,
      cachedTokens: 2,
      reasoningTokens: 3,
    });
  });

  it("marks estimated usage", () => {
    expect(estimateUsageFromContent("hello world")).toEqual({
      inputTokens: 3,
      outputTokens: 3,
      totalTokens: 6,
      usageEstimated: true,
    });
  });

  it("merges usage from stream buffers", () => {
    const buffer = [
      'data: {"usage":{"prompt_tokens":4,"completion_tokens":1,"total_tokens":5}}',
      "",
      "data: [DONE]",
      "",
    ].join("\n");

    expect(readUsageFromStreamBuffer(buffer, {})).toEqual({
      inputTokens: 4,
      outputTokens: 1,
      totalTokens: 5,
    });
  });

  it("preserves estimated flag when merging", () => {
    expect(
      mergeUsage({ usageEstimated: true }, { inputTokens: 4, outputTokens: 2 }),
    ).toEqual({
      usageEstimated: true,
      inputTokens: 4,
      outputTokens: 2,
    });
  });
});
