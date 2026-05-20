import { describe, expect, it } from "vitest";
import { reconcileManagedAliases } from "../cleanup";

describe("reconcileManagedAliases", () => {
  it("removes stale managed aliases and preserves custom aliases", () => {
    const existingAliases = {
      "quick/gpt-5.5": "old-quick-model",
      "deep/gpt-5.5": "old-deep-model",
      "custom/alias": "keep-me",
    };

    const nextManagedAliases = {
      "quick/gpt-5.5": "new-quick-model",
      "explorer/gpt-5.5": "new-explorer-model",
    };

    const previousManagedAliasKeys = ["quick/gpt-5.5", "deep/gpt-5.5"] as const;

    const result = reconcileManagedAliases(
      existingAliases,
      nextManagedAliases,
      previousManagedAliasKeys,
    );

    expect(result.aliases).toEqual({
      "quick/gpt-5.5": "new-quick-model",
      "explorer/gpt-5.5": "new-explorer-model",
      "custom/alias": "keep-me",
    });
    expect(result.managedAliasKeys).toEqual([
      "explorer/gpt-5.5",
      "quick/gpt-5.5",
    ]);
  });

  it("clears all previously managed aliases when next set is empty", () => {
    const existingAliases = {
      "quick/gpt-5.5": "old-quick-model",
      "custom/alias": "keep-me",
    };

    const result = reconcileManagedAliases(existingAliases, {}, [
      "quick/gpt-5.5",
    ]);

    expect(result.aliases).toEqual({
      "custom/alias": "keep-me",
    });
    expect(result.managedAliasKeys).toEqual([]);
  });

  it("infers stale managed aliases on first sync when metadata is absent", () => {
    const existingAliases = {
      "removed-agent/gpt-5.5": "old-model",
      "custom/keep": "keep-me",
    };

    const nextManagedAliases = {
      "active-agent/gpt-5.5": "new-model",
    };

    const result = reconcileManagedAliases(existingAliases, nextManagedAliases);

    expect(result.aliases).toEqual({
      "active-agent/gpt-5.5": "new-model",
      "custom/keep": "keep-me",
    });
    expect(result.managedAliasKeys).toEqual(["active-agent/gpt-5.5"]);
  });
});
