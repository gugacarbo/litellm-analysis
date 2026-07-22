import { describe, expect, it } from "vitest";
import {
  normalizeArtificialAnalysis,
  normalizeOpenRouter,
  openRouterFallbackAttribution,
} from "./normalizers";

describe("benchmark normalizers", () => {
  it("keeps Artificial Analysis normalized metrics", () => {
    const snapshot = normalizeArtificialAnalysis({
      data: [
        {
          id: "aa-1",
          name: "AA One",
          slug: "aa-one",
          model_creator: { name: "Provider" },
          evaluations: { intelligence_index: 42 },
          pricing: { price_1m_input_tokens: 1.2 },
        },
      ],
    });
    expect(snapshot.items[0]).toMatchObject({
      source: "artificial-analysis",
      intelligenceIndex: 42,
      creatorName: "Provider",
    });
  });

  it("preserves mixed OpenRouter items with independent fallback attribution when meta is null", () => {
    const snapshot = normalizeOpenRouter({
      data: [
        {
          source: "artificial-analysis",
          model_permaslug: "one/model",
          display_name: "One",
          intelligence_index: 50,
          pricing: { prompt: "0.000001", completion: "0.000002" },
        },
        {
          source: "design-arena",
          model_permaslug: "two/model",
          display_name: "Two",
          arena: "models",
          category: "code",
          elo: 1200,
          win_rate: 55,
          avg_generation_time_ms: 2000,
        },
      ],
      meta: null,
    });
    expect(snapshot.items.map((item) => item.subsource)).toEqual([
      "artificial-analysis",
      "design-arena",
    ]);
    expect(snapshot.items[0]?.attribution).toEqual(
      openRouterFallbackAttribution("artificial-analysis"),
    );
    expect(snapshot.items[1]?.attribution).toEqual(
      openRouterFallbackAttribution("design-arena"),
    );
    expect(snapshot.items[1]).toMatchObject({
      elo: 1200,
      winRate: 55,
      averageTimeSeconds: 2,
    });
    expect(snapshot.metadata.attribution).toEqual({
      label: "OpenRouter Benchmarks",
      url: "https://openrouter.ai/api/v1/benchmarks",
      citation: null,
    });
  });

  it("rejects a filtered response with the wrong source discriminator", () => {
    expect(() =>
      normalizeOpenRouter(
        {
          data: [
            {
              source: "design-arena",
              model_permaslug: "two/model",
              display_name: "Two",
              arena: "models",
              category: "code",
              elo: 1200,
              win_rate: 55,
            },
          ],
          meta: {},
        },
        "artificial-analysis",
      ),
    ).toThrow("does not match request");
  });

  it("keeps distinct Design Arena rows that share model, arena, and category", () => {
    const snapshot = normalizeOpenRouter({
      data: [
        {
          source: "design-arena",
          model_permaslug: "z-ai/glm-5.1-20260406",
          display_name: "GLM-5.1",
          arena: "models",
          category: "dataviz",
          elo: 1366,
          win_rate: 67,
        },
        {
          source: "design-arena",
          model_permaslug: "z-ai/glm-5.1-20260406",
          display_name: "GLM-5.1",
          arena: "models",
          category: "dataviz",
          elo: 1318,
          win_rate: 61.1,
        },
      ],
      meta: { source: "design-arena" },
    });

    expect(snapshot.items).toHaveLength(2);
    expect(snapshot.items.map((item) => item.id)).toEqual([
      "design-arena:z-ai/glm-5.1-20260406:models:dataviz:1",
      "design-arena:z-ai/glm-5.1-20260406:models:dataviz:2",
    ]);
  });
});
