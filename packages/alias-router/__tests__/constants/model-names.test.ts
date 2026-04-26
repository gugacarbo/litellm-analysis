import { describe, expect, it } from "vitest";
import {
  AGENT_KEYS,
  CATEGORY_KEYS,
  MODEL_NAMES,
} from "../../src/constants/model-names";

describe("MODEL_NAMES", () => {
  it("should have exactly 5 model names", () => {
    expect(MODEL_NAMES).toHaveLength(5);
  });

  it("should contain gpt-5.5 through gpt-5.1", () => {
    expect(MODEL_NAMES).toEqual([
      "gpt-5.5",
      "gpt-5.4",
      "gpt-5.3",
      "gpt-5.2",
      "gpt-5.1",
    ]);
  });

  it("should be readonly tuples", () => {
    expect(MODEL_NAMES[0]).toBe("gpt-5.5");
  });
});

describe("AGENT_KEYS", () => {
  it("should contain all expected agent keys", () => {
    const expected = [
      "sisyphus",
      "oracle",
      "prometheus",
      "explore",
      "multimodal-looker",
      "metis",
      "atlas",
      "librarian",
      "sisyphus-junior",
      "momus",
      "hephaestus",
    ];
    expect(AGENT_KEYS).toEqual(expected);
  });

  it("should have sisyphus as first key", () => {
    expect(AGENT_KEYS[0]).toBe("sisyphus");
  });

  it("should have hephaestus as last key", () => {
    expect(AGENT_KEYS[AGENT_KEYS.length - 1]).toBe("hephaestus");
  });
});

describe("CATEGORY_KEYS", () => {
  it("should contain all expected category keys", () => {
    const expected = [
      "visual-engineering",
      "ultrabrain",
      "deep",
      "artistry",
      "quick",
      "unspecified-low",
      "unspecified-high",
      "writing",
    ];
    expect(CATEGORY_KEYS).toEqual(expected);
  });

  it("should have visual-engineering as first key", () => {
    expect(CATEGORY_KEYS[0]).toBe("visual-engineering");
  });

  it("should have writing as last key", () => {
    expect(CATEGORY_KEYS[CATEGORY_KEYS.length - 1]).toBe("writing");
  });
});
