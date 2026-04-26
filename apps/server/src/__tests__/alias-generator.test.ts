import { describe, expect, it } from "vitest";
import {
  AGENT_KEYS,
  CATEGORY_KEYS,
  sortAliasesByDefinitionOrder,
} from "../services/alias-generator";

describe("sortAliasesByDefinitionOrder", () => {
  it("returns empty object for empty input", () => {
    expect(sortAliasesByDefinitionOrder({})).toEqual({});
  });

  it("sorts agent aliases first in AGENT_KEYS order", () => {
    const aliases = {
      "oracle/gpt-5.4": "openai/o3-mini",
      "sisyphus/gpt-5.4": "openai/gpt-4.1",
      "sisyphus/gpt-5.3": "anthropic/claude-3-7-sonnet",
      "explore/gpt-5.4": "anthropic/claude-sonnet-4",
    };

    const result = sortAliasesByDefinitionOrder(aliases);
    const keys = Object.keys(result);

    // sisyphus comes before oracle and explore in AGENT_KEYS
    expect(keys.indexOf("sisyphus/gpt-5.4")).toBeLessThan(
      keys.indexOf("oracle/gpt-5.4"),
    );
    expect(keys.indexOf("sisyphus/gpt-5.3")).toBeLessThan(
      keys.indexOf("oracle/gpt-5.4"),
    );
    expect(keys.indexOf("oracle/gpt-5.4")).toBeLessThan(
      keys.indexOf("explore/gpt-5.4"),
    );
  });

  it("sorts category aliases after agent aliases", () => {
    const aliases = {
      "visual-engineering/gpt-5.4": "anthropic/claude-sonnet-4",
      "sisyphus/gpt-5.4": "openai/gpt-4.1",
      "quick/gpt-5.4": "openai/gpt-5.4-mini",
    };

    const result = sortAliasesByDefinitionOrder(aliases);
    const keys = Object.keys(result);

    // Agent (sisyphus) should come before categories
    expect(keys.indexOf("sisyphus/gpt-5.4")).toBeLessThan(
      keys.indexOf("visual-engineering/gpt-5.4"),
    );
    expect(keys.indexOf("visual-engineering/gpt-5.4")).toBeLessThan(
      keys.indexOf("quick/gpt-5.4"),
    );
  });

  it("sorts custom aliases last, alphabetically", () => {
    const aliases = {
      "zebra-alias": "some-model",
      "alpha-alias": "another-model",
      "sisyphus/gpt-5.4": "openai/gpt-4.1",
      "beta-alias": "third-model",
    };

    const result = sortAliasesByDefinitionOrder(aliases);
    const keys = Object.keys(result);

    // Agent alias first
    expect(keys[0]).toBe("sisyphus/gpt-5.4");

    // Custom aliases at the end, alphabetically
    const customKeys = keys.filter(
      (k) =>
        !AGENT_KEYS.includes(k as (typeof AGENT_KEYS)[number]) &&
        !CATEGORY_KEYS.includes(k as (typeof CATEGORY_KEYS)[number]) &&
        !k.includes("/"),
    );
    expect(customKeys).toEqual(["alpha-alias", "beta-alias", "zebra-alias"]);
  });

  it("handles mixed agent, category, and custom aliases", () => {
    const aliases = {
      "custom-z": "model-z",
      "writing/gpt-5.4": "anthropic/claude-haiku",
      "oracle/gpt-5.4": "openai/o3-mini",
      "custom-a": "model-a",
      "sisyphus/gpt-5.4": "openai/gpt-4.1",
      "deep/gpt-5.4": "google/gemini-2.5-pro",
    };

    const result = sortAliasesByDefinitionOrder(aliases);
    const keys = Object.keys(result);

    // Agents first (sisyphus before oracle)
    expect(keys.indexOf("sisyphus/gpt-5.4")).toBeLessThan(
      keys.indexOf("oracle/gpt-5.4"),
    );

    // Categories after agents (deep before writing)
    expect(keys.indexOf("oracle/gpt-5.4")).toBeLessThan(
      keys.indexOf("deep/gpt-5.4"),
    );
    expect(keys.indexOf("deep/gpt-5.4")).toBeLessThan(
      keys.indexOf("writing/gpt-5.4"),
    );

    // Custom aliases last, alphabetically
    expect(keys[keys.length - 2]).toBe("custom-a");
    expect(keys[keys.length - 1]).toBe("custom-z");
  });

  it("preserves values correctly after sorting", () => {
    const aliases = {
      "custom-z": "model-z",
      "sisyphus/gpt-5.4": "openai/gpt-4.1",
      "custom-a": "model-a",
    };

    const result = sortAliasesByDefinitionOrder(aliases);

    expect(result["sisyphus/gpt-5.4"]).toBe("openai/gpt-4.1");
    expect(result["custom-a"]).toBe("model-a");
    expect(result["custom-z"]).toBe("model-z");
  });

  it("handles agent base key (without prefix)", () => {
    const aliases = {
      sisyphus: "openai/gpt-4.1",
      "oracle/gpt-5.4": "openai/o3-mini",
    };

    const result = sortAliasesByDefinitionOrder(aliases);
    const keys = Object.keys(result);

    // sisyphus base key should come before oracle prefixed key
    expect(keys[0]).toBe("sisyphus");
    expect(keys[1]).toBe("oracle/gpt-5.4");
  });

  it("handles category base key (without prefix)", () => {
    const aliases = {
      "visual-engineering": "anthropic/claude-sonnet-4",
      "sisyphus/gpt-5.4": "openai/gpt-4.1",
    };

    const result = sortAliasesByDefinitionOrder(aliases);
    const keys = Object.keys(result);

    // Agent should come before category
    expect(keys[0]).toBe("sisyphus/gpt-5.4");
    expect(keys[1]).toBe("visual-engineering");
  });
});
