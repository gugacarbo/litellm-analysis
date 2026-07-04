import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createBenchmarksRepository } from "@lite-llm/benchmarks-repository";
import { z } from "zod";

const API_URL = "https://artificialanalysis.ai/api/v2/data/llms/models";
const SOURCE_NAME = "Artificial Analysis";
const SOURCE_URL = "https://artificialanalysis.ai/";

const creatorSchema = z
  .object({
    id: z.string().nullable().optional(),
    name: z.string(),
    slug: z.string().nullable().optional(),
  })
  .passthrough();

const pricingSchema = z
  .object({
    price_1m_input_tokens: z.number().nullable().optional(),
    price_1m_output_tokens: z.number().nullable().optional(),
    price_1m_blended_3_to_1: z.number().nullable().optional(),
  })
  .passthrough();

const modelSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    slug: z.string().nullable().optional(),
    model_creator: creatorSchema,
    evaluations: z.record(z.string(), z.unknown()).optional(),
    pricing: pricingSchema.optional(),
    median_output_tokens_per_second: z.number().nullable().optional(),
    median_time_to_first_token_seconds: z.number().nullable().optional(),
    median_time_to_first_answer_token: z.number().nullable().optional(),
  })
  .passthrough();

const apiResponseSchema = z
  .object({
    data: z.array(modelSchema),
    status: z.number().optional(),
  })
  .passthrough();

const normalizedModelSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string().nullable(),
  creatorId: z.string().nullable(),
  creatorName: z.string(),
  creatorSlug: z.string().nullable(),
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
}

function getNumber(
  source: Record<string, unknown> | undefined,
  key: string,
): number | null {
  if (!source) return null;
  const value = source[key];
  return typeof value === "number" ? value : null;
}

function normalizeModel(model: z.infer<typeof modelSchema>): NormalizedModel {
  return {
    id: model.id,
    name: model.name,
    slug: model.slug ?? null,
    creatorId: model.model_creator.id ?? null,
    creatorName: model.model_creator.name,
    creatorSlug: model.model_creator.slug ?? null,
    intelligenceIndex: getNumber(model.evaluations, "intelligence_index"),
    codingIndex: getNumber(model.evaluations, "coding_index"),
    mathIndex: getNumber(model.evaluations, "math_index"),
    mmluPro: getNumber(model.evaluations, "mmlu_pro"),
    gpqa: getNumber(model.evaluations, "gpqa"),
    hle: getNumber(model.evaluations, "hle"),
    livecodebench: getNumber(model.evaluations, "livecodebench"),
    scicode: getNumber(model.evaluations, "scicode"),
    math500: getNumber(model.evaluations, "math500"),
    aime: getNumber(model.evaluations, "aime"),
    aime25: getNumber(model.evaluations, "aime25"),
    tau2: getNumber(model.evaluations, "tau2"),
    ifbench: getNumber(model.evaluations, "ifbench"),
    lcr: getNumber(model.evaluations, "lcr"),
    terminalbenchHard: getNumber(model.evaluations, "terminalbench_hard"),
    priceInput1mTokens: model.pricing?.price_1m_input_tokens ?? null,
    priceOutput1mTokens: model.pricing?.price_1m_output_tokens ?? null,
    priceBlended1mTokens: model.pricing?.price_1m_blended_3_to_1 ?? null,
    medianOutputTokensPerSecond: model.median_output_tokens_per_second ?? null,
    medianTimeToFirstTokenSeconds:
      model.median_time_to_first_token_seconds ?? null,
    medianTimeToFirstAnswerTokenSeconds:
      model.median_time_to_first_answer_token ?? null,
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

/**
 * Fetch benchmarks from Artificial Analysis API, normalize, save JSONs,
 * and persist to the database — all in-process.
 */
export async function fetchAndPersistBenchmarks(
  options: BenchmarkFetchOptions,
): Promise<BenchmarkFetchResult> {
  const { apiKey, outputDir } = options;

  await mkdir(outputDir, { recursive: true });

  // 1. Fetch from API
  const response = await fetch(API_URL, {
    method: "GET",
    headers: { "x-api-key": apiKey },
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(
      `Artificial Analysis request failed: HTTP ${response.status} ${body.slice(0, 300)}`,
    );
  }

  // 2. Save raw response
  const rawOutputFile = path.join(outputDir, "artificial-analysis-models.raw.json");
  await writeFile(rawOutputFile, body, "utf8");

  // 3. Parse and normalize
  const parsedApiResponse = apiResponseSchema.parse(JSON.parse(body));
  const normalizedModels = parsedApiResponse.data
    .map(normalizeModel)
    .sort(sortByIntelligenceThenName);

  // 4. Save normalized JSON
  const dataset = {
    source: SOURCE_NAME,
    sourceUrl: SOURCE_URL,
    fetchedAt: new Date().toISOString(),
    count: normalizedModels.length,
    models: normalizedModels,
  };
  const normalizedOutputFile = path.join(
    outputDir,
    "artificial-analysis-models.json",
  );
  await writeFile(normalizedOutputFile, JSON.stringify(dataset, null, 2), "utf8");

  // 5. Save JSON schema
  const schemaOutputFile = path.join(
    outputDir,
    "artificial-analysis-models.schema.json",
  );
  await writeFile(
    schemaOutputFile,
    JSON.stringify(z.toJSONSchema(z.object({
      source: z.string(),
      sourceUrl: z.string(),
      fetchedAt: z.string(),
      count: z.number().int().nonnegative(),
      models: z.array(normalizedModelSchema),
    })), null, 2),
    "utf8",
  );

  // 6. Persist to database
  const repo = createBenchmarksRepository();
  await repo.clear();
  await repo.upsert(normalizedModels);

  return { count: normalizedModels.length, models: normalizedModels };
}
