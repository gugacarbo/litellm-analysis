import type {
  ArtificialAnalysisBenchmarkItem,
  BenchmarkAttribution,
  BenchmarkNativeValue,
  BenchmarkSnapshotMetadata,
  OpenRouterBenchmarkItem,
  OpenRouterBenchmarkSubsource,
} from "@lite-llm/contracts/benchmarks";
import { z } from "zod";

const recordSchema = z.record(z.string(), z.unknown());
const nullableNumber = z.number().nullable().optional();
const pricingSchema = z
  .object({
    prompt: z.string().nullable().optional(),
    completion: z.string().nullable().optional(),
  })
  .nullable()
  .optional();

const aaModelSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string().nullable().optional(),
    model_creator: z.object({
      id: z.string().nullable().optional(),
      name: z.string(),
      slug: z.string().nullable().optional(),
    }),
    evaluations: recordSchema.optional(),
    pricing: z
      .object({
        price_1m_input_tokens: nullableNumber,
        price_1m_output_tokens: nullableNumber,
        price_1m_blended_3_to_1: nullableNumber,
      })
      .optional(),
    median_output_tokens_per_second: nullableNumber,
    median_time_to_first_token_seconds: nullableNumber,
    median_time_to_first_answer_token: nullableNumber,
  })
  .passthrough();

const openRouterItemSchema = z
  .object({
    source: z.enum(["artificial-analysis", "design-arena"]),
    model_permaslug: z.string(),
    display_name: z.string(),
    intelligence_index: nullableNumber,
    elo: nullableNumber,
    win_rate: nullableNumber,
    avg_generation_time_ms: nullableNumber,
    arena: z.string().nullable().optional(),
    category: z.string().nullable().optional(),
    pricing: pricingSchema,
  })
  .passthrough();

const openRouterResponseSchema = z.object({
  data: z.array(openRouterItemSchema),
  meta: z
    .object({
      as_of: z.string().optional(),
      citation: z.string().nullable().optional(),
      source: z
        .enum(["artificial-analysis", "design-arena"])
        .nullable()
        .optional(),
      source_url: z.string().nullable().optional(),
    })
    .passthrough()
    .nullable()
    .optional(),
});

const AA_ATTRIBUTION: BenchmarkAttribution = {
  label: "Artificial Analysis",
  url: "https://artificialanalysis.ai/",
  citation: null,
};

function numberAt(record: Record<string, unknown> | undefined, key: string) {
  const value = record?.[key];
  return typeof value === "number" ? value : null;
}

function pricePerMillion(value: string | null | undefined): number | null {
  const parsed = value ? Number.parseFloat(value) : Number.NaN;
  return Number.isFinite(parsed) ? parsed * 1_000_000 : null;
}

function providerFromPermaslug(value: string): string | null {
  return value.split("/")[0] ?? null;
}

export function openRouterFallbackAttribution(
  subsource: OpenRouterBenchmarkSubsource,
): BenchmarkAttribution {
  return {
    label: `OpenRouter Benchmarks — ${subsource}`,
    url: `https://openrouter.ai/api/v1/benchmarks?source=${subsource}`,
    citation: null,
  };
}

export function normalizeArtificialAnalysis(input: unknown): {
  metadata: BenchmarkSnapshotMetadata;
  items: ArtificialAnalysisBenchmarkItem[];
} {
  const parsed = z.object({ data: z.array(aaModelSchema) }).parse(input);
  const items = parsed.data.map((model) => ({
    id: model.id,
    name: model.name,
    slug: model.slug ?? null,
    creatorId: model.model_creator.id ?? null,
    creatorName: model.model_creator.name,
    creatorSlug: model.model_creator.slug ?? null,
    source: "artificial-analysis" as const,
    intelligenceIndex: numberAt(model.evaluations, "intelligence_index"),
    codingIndex: numberAt(model.evaluations, "coding_index"),
    mathIndex: numberAt(model.evaluations, "math_index"),
    mmluPro: numberAt(model.evaluations, "mmlu_pro"),
    gpqa: numberAt(model.evaluations, "gpqa"),
    hle: numberAt(model.evaluations, "hle"),
    livecodebench: numberAt(model.evaluations, "livecodebench"),
    scicode: numberAt(model.evaluations, "scicode"),
    math500: numberAt(model.evaluations, "math500"),
    aime: numberAt(model.evaluations, "aime"),
    aime25: numberAt(model.evaluations, "aime25"),
    tau2: numberAt(model.evaluations, "tau2"),
    ifbench: numberAt(model.evaluations, "ifbench"),
    lcr: numberAt(model.evaluations, "lcr"),
    terminalbenchHard: numberAt(model.evaluations, "terminalbench_hard"),
    priceInput1mTokens: model.pricing?.price_1m_input_tokens ?? null,
    priceOutput1mTokens: model.pricing?.price_1m_output_tokens ?? null,
    priceBlended1mTokens: model.pricing?.price_1m_blended_3_to_1 ?? null,
    medianOutputTokensPerSecond: model.median_output_tokens_per_second ?? null,
    medianTimeToFirstTokenSeconds:
      model.median_time_to_first_token_seconds ?? null,
    medianTimeToFirstAnswerTokenSeconds:
      model.median_time_to_first_answer_token ?? null,
  }));
  return {
    metadata: {
      catalog: "artificial-analysis",
      fetchedAt: new Date().toISOString(),
      count: items.length,
      attribution: AA_ATTRIBUTION,
    },
    items,
  };
}

export function normalizeOpenRouter(
  input: unknown,
  expectedSource?: OpenRouterBenchmarkSubsource,
): { metadata: BenchmarkSnapshotMetadata; items: OpenRouterBenchmarkItem[] } {
  const parsed = openRouterResponseSchema.parse(input);
  const meta = parsed.meta ?? null;
  const baseIds = parsed.data.map((item) => openRouterEntryIdBase(item));
  const baseIdCounts = new Map<string, number>();
  for (const id of baseIds) {
    baseIdCounts.set(id, (baseIdCounts.get(id) ?? 0) + 1);
  }
  const seenBaseIds = new Map<string, number>();
  const items = parsed.data.map((item, index) => {
    if (expectedSource && item.source !== expectedSource) {
      throw new Error("OpenRouter benchmark source does not match request");
    }
    const baseId = baseIds[index];
    const occurrence = seenBaseIds.get(baseId) ?? 0;
    seenBaseIds.set(baseId, occurrence + 1);
    const fallback = openRouterFallbackAttribution(item.source);
    const attribution: BenchmarkAttribution = {
      label: meta?.source ?? fallback.label,
      url: meta?.source_url ?? fallback.url,
      citation: meta?.citation ?? null,
    };
    return {
      // Design Arena may publish more than one result for the same model,
      // arena, and category. Keep each source-native row instead of making
      // the snapshot's unique external_id constraint reject the whole sync.
      id:
        baseIdCounts.get(baseId) === 1 ? baseId : `${baseId}:${occurrence + 1}`,
      subsource: item.source,
      modelPermaslug: item.model_permaslug,
      name: item.display_name,
      provider: providerFromPermaslug(item.model_permaslug),
      arena: item.arena ?? null,
      category: item.category ?? null,
      elo: item.elo ?? null,
      winRate: item.win_rate ?? null,
      averageTimeSeconds:
        item.avg_generation_time_ms === null ||
        item.avg_generation_time_ms === undefined
          ? null
          : item.avg_generation_time_ms / 1_000,
      intelligenceIndex: item.intelligence_index ?? null,
      priceInput1mTokens: pricePerMillion(item.pricing?.prompt),
      priceOutput1mTokens: pricePerMillion(item.pricing?.completion),
      attribution,
      native: item as unknown as Record<string, BenchmarkNativeValue>,
    } satisfies OpenRouterBenchmarkItem;
  });
  const fallback = expectedSource
    ? openRouterFallbackAttribution(expectedSource)
    : {
        label: "OpenRouter Benchmarks",
        url: "https://openrouter.ai/api/v1/benchmarks",
        citation: null,
      };
  return {
    metadata: {
      catalog: "openrouter",
      fetchedAt: meta?.as_of ?? new Date().toISOString(),
      count: items.length,
      attribution: {
        label: meta?.source ?? fallback.label,
        url: meta?.source_url ?? fallback.url,
        citation: meta?.citation ?? null,
      },
    },
    items,
  };
}

function openRouterEntryIdBase(item: z.infer<typeof openRouterItemSchema>) {
  return `${item.source}:${item.model_permaslug}:${item.arena ?? ""}:${item.category ?? ""}`;
}
