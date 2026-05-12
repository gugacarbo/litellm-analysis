import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const API_URL = "https://artificialanalysis.ai/api/v2/data/llms/models";
const SOURCE_NAME = "Artificial Analysis";
const SOURCE_URL = "https://artificialanalysis.ai/";

interface Options {
  forceRefresh: boolean;
  useCache: boolean;
}

interface RateLimitState {
  timestamps: number[];
}

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const skillDir = path.join(rootDir, ".agents", "skills", "artificial-analysis");

const envFilePath = process.env.ENV_FILE ?? path.join(skillDir, ".env");
const cacheDir = process.env.CACHE_DIR ?? path.join(skillDir, ".cache");
const rawCacheFile =
  process.env.RAW_CACHE_FILE ?? path.join(cacheDir, "models.json");
const rateLimitStateFile =
  process.env.STATE_FILE ?? path.join(cacheDir, "rate-limit-state.json");

const outputDir =
  process.env.OUTPUT_DIR ?? path.join(rootDir, "data", "benchmarks");
const rawOutputFile = path.join(
  outputDir,
  "artificial-analysis-models.raw.json",
);
const normalizedOutputFile = path.join(
  outputDir,
  "artificial-analysis-models.json",
);
const schemaOutputFile = path.join(
  outputDir,
  "artificial-analysis-models.schema.json",
);
const interfacesOutputFile = path.join(
  outputDir,
  "artificial-analysis-models.d.ts",
);

const rateLimitQpm = parsePositiveInt(process.env.RATE_LIMIT_QPM, 5);
const minResponseSeconds = parsePositiveFloat(
  process.env.MIN_RESPONSE_SECONDS,
  1,
);

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
  priceInput1mTokens: z.number().nullable(),
  priceOutput1mTokens: z.number().nullable(),
  priceBlended1mTokens: z.number().nullable(),
  medianOutputTokensPerSecond: z.number().nullable(),
  medianTimeToFirstTokenSeconds: z.number().nullable(),
  medianTimeToFirstAnswerTokenSeconds: z.number().nullable(),
});

const normalizedDatasetSchema = z.object({
  source: z.string(),
  sourceUrl: z.string(),
  fetchedAt: z.string(),
  count: z.number().int().nonnegative(),
  models: z.array(normalizedModelSchema),
});

async function main(): Promise<void> {
  const startedAt = Date.now();
  const options = parseOptions(process.argv.slice(2));

  try {
    await loadEnvFile(envFilePath);
    const apiKey = process.env.ARTIFICIAL_ANALYSIS_API_KEY;
    if (!apiKey) {
      throw new Error(
        `Missing ARTIFICIAL_ANALYSIS_API_KEY in env or ${envFilePath}`,
      );
    }

    await mkdir(cacheDir, { recursive: true });
    await mkdir(outputDir, { recursive: true });

    const rawResponse = await getRawResponse(apiKey, options);
    await writeFile(rawOutputFile, rawResponse, "utf8");

    const parsedApiResponse = apiResponseSchema.parse(JSON.parse(rawResponse));
    const normalizedModels = parsedApiResponse.data
      .map(normalizeModel)
      .sort(sortByIntelligenceThenName);

    const dataset = normalizedDatasetSchema.parse({
      source: SOURCE_NAME,
      sourceUrl: SOURCE_URL,
      fetchedAt: new Date().toISOString(),
      count: normalizedModels.length,
      models: normalizedModels,
    });

    await writeFile(
      normalizedOutputFile,
      JSON.stringify(dataset, null, 2),
      "utf8",
    );
    await writeFile(
      schemaOutputFile,
      JSON.stringify(z.toJSONSchema(normalizedDatasetSchema), null, 2),
      "utf8",
    );
    await writeFile(interfacesOutputFile, buildInterfacesFile(), "utf8");

    console.log(
      `Saved ${dataset.count} models to ${path.relative(rootDir, normalizedOutputFile)}`,
    );
  } finally {
    await enforceMinResponseTime(startedAt, minResponseSeconds);
  }
}

async function getRawResponse(
  apiKey: string,
  options: Options,
): Promise<string> {
  if (options.useCache && !options.forceRefresh) {
    const cached = await readTextIfExists(rawCacheFile);
    if (cached) {
      return cached;
    }
  }

  await applyLocalRateLimit(rateLimitQpm, rateLimitStateFile);

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

  if (options.useCache) {
    await writeFile(rawCacheFile, body, "utf8");
  }

  return body;
}

function normalizeModel(
  model: z.infer<typeof modelSchema>,
): z.infer<typeof normalizedModelSchema> {
  return {
    id: model.id,
    name: model.name,
    slug: model.slug ?? null,
    creatorId: model.model_creator.id ?? null,
    creatorName: model.model_creator.name,
    creatorSlug: model.model_creator.slug ?? null,
    intelligenceIndex: getEvaluation(
      model.evaluations,
      "artificial_analysis_intelligence_index",
    ),
    codingIndex: getEvaluation(
      model.evaluations,
      "artificial_analysis_coding_index",
    ),
    mathIndex: getEvaluation(
      model.evaluations,
      "artificial_analysis_math_index",
    ),
    mmluPro: getEvaluation(model.evaluations, "mmlu_pro"),
    gpqa: getEvaluation(model.evaluations, "gpqa"),
    hle: getEvaluation(model.evaluations, "hle"),
    livecodebench: getEvaluation(model.evaluations, "livecodebench"),
    scicode: getEvaluation(model.evaluations, "scicode"),
    math500: getEvaluation(model.evaluations, "math_500"),
    aime: getEvaluation(model.evaluations, "aime"),
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

function getEvaluation(
  evaluations: Record<string, unknown> | undefined,
  key: string,
): number | null {
  const value = evaluations?.[key];
  return typeof value === "number" ? value : null;
}

function sortByIntelligenceThenName(
  a: z.infer<typeof normalizedModelSchema>,
  b: z.infer<typeof normalizedModelSchema>,
): number {
  const ai = a.intelligenceIndex ?? Number.NEGATIVE_INFINITY;
  const bi = b.intelligenceIndex ?? Number.NEGATIVE_INFINITY;
  if (bi !== ai) return bi - ai;
  return a.name.localeCompare(b.name);
}

function parseOptions(args: string[]): Options {
  const options: Options = {
    forceRefresh: false,
    useCache: true,
  };

  for (const arg of args) {
    if (arg === "--force-refresh") {
      options.forceRefresh = true;
      continue;
    }
    if (arg === "--no-cache") {
      options.useCache = false;
      continue;
    }
    if (arg === "-h" || arg === "--help") {
      printHelp();
      process.exit(0);
    }
    throw new Error(`Unknown option: ${arg}`);
  }

  return options;
}

function printHelp(): void {
  console.log(`
Usage: tsx scripts/sync-aa-benchmarks.ts [--force-refresh] [--no-cache]

Options:
  --force-refresh  ignore cache and fetch from API
  --no-cache       disable cache read/write

Env:
  ARTIFICIAL_ANALYSIS_API_KEY
  ENV_FILE                (default: .agents/skills/artificial-analysis/.env)
  CACHE_DIR               (default: .agents/skills/artificial-analysis/.cache)
  RAW_CACHE_FILE          (default: .agents/skills/artificial-analysis/.cache/models.json)
  STATE_FILE              (default: .agents/skills/artificial-analysis/.cache/rate-limit-state.json)
  OUTPUT_DIR              (default: data/benchmarks)
  RATE_LIMIT_QPM          (default: 5)
  MIN_RESPONSE_SECONDS    (default: 1)
`);
}

async function loadEnvFile(filePath: string): Promise<void> {
  const content = await readTextIfExists(filePath);
  if (!content) return;

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const separator = trimmed.indexOf("=");
    if (separator <= 0) continue;
    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    if (!process.env[key]) {
      process.env[key] = stripWrappingQuotes(value);
    }
  }
}

function stripWrappingQuotes(value: string): string {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}

async function applyLocalRateLimit(
  qpm: number,
  stateFile: string,
): Promise<void> {
  const now = Date.now();
  const oneMinuteAgo = now - 60_000;

  const state = await readRateLimitState(stateFile);
  const recent = state.timestamps.filter((ts) => ts >= oneMinuteAgo);

  if (recent.length >= qpm) {
    const oldest = recent[0];
    const waitMs = Math.max(0, 60_000 - (now - oldest));
    if (waitMs > 0) {
      await sleep(waitMs);
    }
  }

  const afterWaitNow = Date.now();
  const refreshed = (await readRateLimitState(stateFile)).timestamps.filter(
    (ts) => ts >= afterWaitNow - 60_000,
  );
  refreshed.push(afterWaitNow);
  await writeRateLimitState(stateFile, { timestamps: refreshed });
}

async function readRateLimitState(filePath: string): Promise<RateLimitState> {
  const text = await readTextIfExists(filePath);
  if (!text) return { timestamps: [] };

  try {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed.timestamps)) {
      return { timestamps: [] };
    }
    const timestamps = parsed.timestamps.filter(
      (value: unknown): value is number =>
        typeof value === "number" && Number.isFinite(value),
    );
    return { timestamps };
  } catch {
    return { timestamps: [] };
  }
}

async function writeRateLimitState(
  filePath: string,
  state: RateLimitState,
): Promise<void> {
  await writeFile(filePath, JSON.stringify(state, null, 2), "utf8");
}

async function enforceMinResponseTime(
  startedAtMs: number,
  minSeconds: number,
): Promise<void> {
  const elapsedMs = Date.now() - startedAtMs;
  const minMs = Math.round(minSeconds * 1000);
  const remaining = minMs - elapsedMs;
  if (remaining > 0) {
    await sleep(remaining);
  }
}

async function readTextIfExists(filePath: string): Promise<string | null> {
  try {
    await stat(filePath);
    return await readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

function buildInterfacesFile(): string {
  return `/**
 * Auto-generated by scripts/sync-aa-benchmarks.ts
 * Source: ${SOURCE_NAME} (${SOURCE_URL})
 */

export interface ArtificialAnalysisNormalizedModelBenchmark {
  id: string;
  name: string;
  slug: string | null;
  creatorId: string | null;
  creatorName: string;
  creatorSlug: string | null;
  intelligenceIndex: number | null;
  codingIndex: number | null;
  mathIndex: number | null;
  mmluPro: number | null;
  gpqa: number | null;
  hle: number | null;
  livecodebench: number | null;
  scicode: number | null;
  math500: number | null;
  aime: number | null;
  priceInput1mTokens: number | null;
  priceOutput1mTokens: number | null;
  priceBlended1mTokens: number | null;
  medianOutputTokensPerSecond: number | null;
  medianTimeToFirstTokenSeconds: number | null;
  medianTimeToFirstAnswerTokenSeconds: number | null;
}

export interface ArtificialAnalysisModelsDataset {
  source: string;
  sourceUrl: string;
  fetchedAt: string;
  count: number;
  models: ArtificialAnalysisNormalizedModelBenchmark[];
}
`;
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return fallback;
  return parsed;
}

function parsePositiveFloat(
  value: string | undefined,
  fallback: number,
): number {
  if (!value) return fallback;
  const parsed = Number.parseFloat(value);
  if (Number.isNaN(parsed) || parsed < 0) return fallback;
  return parsed;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

main().catch((error) => {
  console.error(String(error));
  process.exitCode = 1;
});
