import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createBenchmarksRepository } from "@lite-llm/benchmarks-repository";
import { z } from "zod";

const API_URL = "https://openrouter.ai/api/v1/benchmarks";
const SOURCE_NAME = "OpenRouter";
const SOURCE_URL = "https://openrouter.ai/";

const pricingSchema = z
  .object({
    prompt: z.string().nullable().optional(),
    completion: z.string().nullable().optional(),
  })
  .passthrough();

const artificialAnalysisItemSchema = z
  .object({
    source: z.literal("artificial-analysis"),
    model_permaslug: z.string(),
    display_name: z.string(),
    intelligence_index: z.number().nullable().optional(),
    coding_index: z.number().nullable().optional(),
    agentic_index: z.number().nullable().optional(),
    pricing: pricingSchema.optional(),
  })
  .passthrough();

const designArenaItemSchema = z
  .object({
    source: z.literal("design-arena"),
    model_permaslug: z.string(),
    display_name: z.string(),
    arena: z.string(),
    category: z.string(),
    elo: z.number(),
    win_rate: z.number(),
    avg_generation_time_ms: z.number().nullable().optional(),
    tournament_stats: z
      .object({
        first_place: z.number().nullable().optional(),
        second_place: z.number().nullable().optional(),
        third_place: z.number().nullable().optional(),
        fourth_place: z.number().nullable().optional(),
        total: z.number().nullable().optional(),
      })
      .optional(),
    pricing: pricingSchema.optional(),
  })
  .passthrough();

const benchmarkItemSchema = z.union([
  artificialAnalysisItemSchema,
  designArenaItemSchema,
]);

const apiResponseSchema = z
  .object({
    data: z.array(benchmarkItemSchema),
    meta: z
      .object({
        as_of: z.string(),
        citation: z.string().nullable().optional(),
        model_count: z.number().int().nonnegative(),
        source: z.union([z.literal("artificial-analysis"), z.literal("design-arena"), z.null()]).optional(),
        source_url: z.string().nullable().optional(),
        task_type: z.string().nullable().optional(),
        version: z.literal("v1"),
      })
      .passthrough(),
  })
  .passthrough();

const normalizedModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().nullable(),
  creatorId: z.string().nullable(),
  creatorName: z.string(),
  creatorSlug: z.string().nullable(),
  source: z.union([z.literal("artificial-analysis"), z.literal("openrouter")]),
  intelligenceIndex: z.number().nullable(),
  codingIndex: z.number().nullable(),
  mathIndex: z.number().nullable(),
  mmluPro: z.number().nullable(),
  gpqa: z.number().nullable(),
  hle: z.number().nullable(),
  livecodebench: z.number().nullable(),
  scicode: z.number().nullable(),
  math500: z.number().nullable(),
  aime: z.number().nullable(),
  aime25: z.number().nullable(),
  tau2: z.number().nullable(),
  ifbench: z.number().nullable(),
  lcr: z.number().nullable(),
  terminalbenchHard: z.number().nullable(),
  priceInput1mTokens: z.number().nullable(),
  priceOutput1mTokens: z.number().nullable(),
  priceBlended1mTokens: z.number().nullable(),
  medianOutputTokensPerSecond: z.number().nullable(),
  medianTimeToFirstTokenSeconds: z.number().nullable(),
  medianTimeToFirstAnswerTokenSeconds: z.number().nullable(),
});

type NormalizedModel = z.infer<typeof normalizedModelSchema>;

export interface BenchmarkFetchResult {
  count: number;
  models: NormalizedModel[];
}

export interface BenchmarkFetchOptions {
  apiKey: string;
  outputDir: string;
  source?: "artificial-analysis" | "design-arena";
  taskType?: "coding" | "intelligence" | "agentic";
}

function parsePrice(priceStr: string | null | undefined): number | null {
  if (!priceStr) return null;
  const parsed = parseFloat(priceStr);
  return isNaN(parsed) ? null : parsed * 1_000_000;
}

function normalizeModel(item: z.infer<typeof benchmarkItemSchema>): NormalizedModel {
  const pricing = item.pricing ?? {};
  const priceInput = parsePrice(pricing.prompt);
  const priceOutput = parsePrice(pricing.completion);
  const priceBlended = priceInput !== null && priceOutput !== null
    ? (priceInput * 3 + priceOutput) / 4
    : null;

  if (item.source === "artificial-analysis") {
    return {
      id: item.model_permaslug,
      name: item.display_name,
      slug: null,
      creatorId: null,
      creatorName: "Unknown",
      creatorSlug: null,
      source: "openrouter",
      intelligenceIndex: item.intelligence_index ?? null,
      codingIndex: item.coding_index ?? null,
      mathIndex: null,
      mmluPro: null,
      gpqa: null,
      hle: null,
      livecodebench: null,
      scicode: null,
      math500: null,
      aime: null,
      aime25: null,
      tau2: null,
      ifbench: null,
      lcr: null,
      terminalbenchHard: null,
      priceInput1mTokens: priceInput,
      priceOutput1mTokens: priceOutput,
      priceBlended1mTokens: priceBlended,
      medianOutputTokensPerSecond: null,
      medianTimeToFirstTokenSeconds: null,
      medianTimeToFirstAnswerTokenSeconds: null,
    };
  }

  return {
    id: item.model_permaslug,
    name: item.display_name,
    slug: null,
    creatorId: null,
    creatorName: "Unknown",
    creatorSlug: null,
    source: "openrouter",
    intelligenceIndex: null,
    codingIndex: null,
    mathIndex: null,
    mmluPro: null,
    gpqa: null,
    hle: null,
    livecodebench: null,
    scicode: null,
    math500: null,
    aime: null,
    aime25: null,
    tau2: null,
    ifbench: null,
    lcr: null,
    terminalbenchHard: null,
    priceInput1mTokens: priceInput,
    priceOutput1mTokens: priceOutput,
    priceBlended1mTokens: priceBlended,
    medianOutputTokensPerSecond: null,
    medianTimeToFirstTokenSeconds: null,
    medianTimeToFirstAnswerTokenSeconds: null,
  };
}

function sortByIntelligenceThenName(
  left: NormalizedModel,
  right: NormalizedModel,
): number {
  const leftScore = left.intelligenceIndex ?? -Infinity;
  const rightScore = right.intelligenceIndex ?? -Infinity;
  if (rightScore !== leftScore) return rightScore - leftScore;
  return left.name.localeCompare(right.name);
}

export async function fetchAndPersistOpenRouterBenchmarks(
  options: BenchmarkFetchOptions,
): Promise<BenchmarkFetchResult> {
  const { apiKey, outputDir, source, taskType } = options;

  await mkdir(outputDir, { recursive: true });

  const params = new URLSearchParams();
  if (source) params.set("source", source);
  if (taskType) params.set("task_type", taskType);

  const url = `${API_URL}?${params.toString()}`;

  const response = await fetch(url, {
    method: "GET",
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(
      `OpenRouter Benchmarks request failed: HTTP ${response.status} ${body.slice(0, 300)}`,
    );
  }

  const rawOutputFile = path.join(outputDir, "openrouter-benchmarks.raw.json");
  await writeFile(rawOutputFile, body, "utf8");

  const parsedApiResponse = apiResponseSchema.parse(JSON.parse(body));
  const normalizedModels = parsedApiResponse.data
    .map(normalizeModel)
    .sort(sortByIntelligenceThenName);

  const dataset = {
    source: SOURCE_NAME,
    sourceUrl: SOURCE_URL,
    fetchedAt: new Date().toISOString(),
    count: normalizedModels.length,
    models: normalizedModels,
  };
  const normalizedOutputFile = path.join(
    outputDir,
    "openrouter-benchmarks.json",
  );
  await writeFile(
    normalizedOutputFile,
    JSON.stringify(dataset, null, 2),
    "utf8",
  );

  const schemaOutputFile = path.join(
    outputDir,
    "openrouter-benchmarks.schema.json",
  );
  await writeFile(
    schemaOutputFile,
    JSON.stringify(
      z.toJSONSchema(
        z.object({
          source: z.string(),
          sourceUrl: z.string(),
          fetchedAt: z.string(),
          count: z.number().int().nonnegative(),
          models: z.array(normalizedModelSchema),
        }),
      ),
      null,
      2,
    ),
    "utf8",
  );

  const repo = createBenchmarksRepository();
  await repo.upsert(normalizedModels);

  return { count: normalizedModels.length, models: normalizedModels };
}