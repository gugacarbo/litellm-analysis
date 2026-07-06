import type { ModelBenchmarkListItem } from "@lite-llm/contracts";
import { describe, expect, it } from "vitest";
import { filterModels } from "../components/filter-models";
import {
  getBenchmarkModelSearchScore,
  matchesBenchmarkModelSearch,
  sortBenchmarkModelsBySearch,
} from "../utils/model-search";

function createModel(
  overrides: Partial<ModelBenchmarkListItem> &
    Pick<ModelBenchmarkListItem, "id" | "name" | "creatorName">,
): ModelBenchmarkListItem {
  return {
    id: overrides.id,
    name: overrides.name,
    creatorName: overrides.creatorName,
    slug: overrides.slug ?? overrides.name.toLowerCase().replace(/\s+/g, "-"),
    intelligenceIndex: null,
    codingIndex: null,
    mathIndex: null,
    priceBlended1mTokens: null,
    medianOutputTokensPerSecond: null,
    medianTimeToFirstTokenSeconds: null,
    isConfigured: false,
  } as ModelBenchmarkListItem;
}

describe("benchmark model search", () => {
  const models = [
    createModel({
      id: "deepseek-v4-flash",
      name: "DeepSeek V4 Flash",
      slug: "deepseek-v4-flash",
      creatorName: "DeepSeek",
    }),
    createModel({
      id: "glm-5.2",
      name: "GLM-5.2 (max)",
      slug: "glm-5-2",
      creatorName: "Z AI",
    }),
    createModel({
      id: "kimi-k2-7-code",
      name: "Kimi K2.7 Code",
      slug: "kimi-k2-7-code",
      creatorName: "Kimi",
    }),
  ];

  it("matches squashed queries against slug and name", () => {
    expect(matchesBenchmarkModelSearch("glm52", models[1])).toBe(true);
    expect(matchesBenchmarkModelSearch("deepsek", models[0])).toBe(true);
    expect(matchesBenchmarkModelSearch("k2 7", models[2])).toBe(true);
  });

  it("ranks closer matches ahead of looser subsequence matches", () => {
    const sorted = sortBenchmarkModelsBySearch("deepseek", models);
    expect(sorted[0]?.id).toBe("deepseek-v4-flash");

    const exactScore = getBenchmarkModelSearchScore("glm-5-2", models[1]);
    const fuzzyScore = getBenchmarkModelSearchScore("glm52", models[1]);
    expect(exactScore).toBeGreaterThan(fuzzyScore);
  });

  it("limits the alias combobox list after fuzzy filtering", () => {
    const filtered = filterModels("k2 7", models);
    expect(filtered.map((model) => model.id)).toEqual(["kimi-k2-7-code"]);
  });
});
