import { describe, expect, it } from "vitest";
import type { ModelDisplayCandidate } from "./model-display";
import { mergeRegistryModelsWithConfigAliases } from "./model-display";

function createModel(
  modelName: string,
  status: ModelDisplayCandidate["status"],
  providerName?: string,
): ModelDisplayCandidate {
  return {
    modelName,
    status,
    enabled: true,
    modelRoute: {
      ...(providerName ? { providerName } : {}),
    },
  };
}

describe("mergeRegistryModelsWithConfigAliases", () => {
  it("keeps only registry-backed models and shows provider-scoped config names as aliases", () => {
    const merged = mergeRegistryModelsWithConfigAliases([
      createModel("deepseek-v4-flash", "registry-only", "Iproute"),
      createModel("Iproute/deepseek-v4-flash", "config-only"),
      createModel("glm-5.2", "registry-only", "Platon"),
      createModel("Platon/glm-5.2", "config-only"),
    ]);

    expect(merged).toHaveLength(2);
    expect(merged.map((model) => model.modelName)).toEqual([
      "deepseek-v4-flash",
      "glm-5.2",
    ]);
    expect(merged[0]?.aliases).toEqual(["Iproute/deepseek-v4-flash"]);
    expect(merged[1]?.aliases).toEqual(["Platon/glm-5.2"]);
  });

  it("ignores config-only entries that do not map to a registry provider/model pair", () => {
    const merged = mergeRegistryModelsWithConfigAliases([
      createModel("deepseek-v4-flash", "registry-only", "Iproute"),
      createModel("legacy-deepseek", "config-only"),
      createModel("Other/deepseek-v4-flash", "config-only"),
    ]);

    expect(merged).toHaveLength(1);
    expect(merged[0]?.modelName).toBe("deepseek-v4-flash");
    expect(merged[0]?.aliases).toEqual([]);
  });
});
