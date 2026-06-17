import { mkdir, readFile, writeFile } from "node:fs/promises";
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
  "..",
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
  process.env.OUTPUT_DIR ?? path.join(rootDir, "@storage", "benchmarks");
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

function getNumber(
  source: Record<string, unknown> | undefined,
  key: string,
): number | null {
  if (!source) {
    return null;
  }

  const value = source[key];
  return typeof value === "number" ? value : null;
}

function sortByIntelligenceThenName(
  left: z.infer<typeof normalizedModelSchema>,
  right: z.infer<typeof normalizedModelSchema>,
): number {
  const leftScore = left.intelligenceIndex ?? -Infinity;
  const rightScore = right.intelligenceIndex ?? -Infinity;

  if (rightScore !== leftScore) {
    return rightScore - leftScore;
  }

  return left.name.localeCompare(right.name);
}

async function readTextIfExists(filePath: string): Promise<string | null> {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return null;
    }

    throw error;
  }
}

async function applyLocalRateLimit(
  qpm: number,
  stateFilePath: string,
): Promise<void> {
  const state = await readRateLimitState(stateFilePath);
  const now = Date.now();
  const windowStart = now - 60_000;

  state.timestamps = state.timestamps.filter(
    (timestamp) => timestamp >= windowStart,
  );

  if (state.timestamps.length >= qpm) {
    const oldest = state.timestamps[0];
    if (oldest !== undefined) {
      const waitMs = Math.max(0, 60_000 - (now - oldest));
      if (waitMs > 0) {
        await wait(waitMs);
      }
    }
  }

  state.timestamps.push(Date.now());
  await writeRateLimitState(stateFilePath, state);
}

async function readRateLimitState(filePath: string): Promise<RateLimitState> {
  const raw = await readTextIfExists(filePath);
  if (!raw) {
    return { timestamps: [] };
  }

  try {
    const parsed = JSON.parse(raw) as Partial<RateLimitState>;
    return {
      timestamps: Array.isArray(parsed.timestamps)
        ? parsed.timestamps.filter(
            (value): value is number => typeof value === "number",
          )
        : [],
    };
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

async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

function parseOptions(args: string[]): Options {
  let forceRefresh = false;
  let useCache = true;

  for (const arg of args) {
    if (arg === "--force-refresh") {
      forceRefresh = true;
    } else if (arg === "--no-cache") {
      useCache = false;
    } else {
      console.error(`Unknown option: ${arg}`);
      process.exit(1);
    }
  }

  return { forceRefresh, useCache };
}

function parsePositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function parsePositiveFloat(
  value: string | undefined,
  fallback: number,
): number {
  const parsed = Number.parseFloat(value ?? "");
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

async function enforceMinResponseTime(
  startedAt: number,
  minSeconds: number,
): Promise<void> {
  const elapsed = Date.now() - startedAt;
  const target = minSeconds * 1000;
  if (elapsed < target) {
    await wait(target - elapsed);
  }
}

async function loadEnvFile(filePath: string): Promise<void> {
  const content = await readTextIfExists(filePath);
  if (!content) {
    return;
  }

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const index = trimmed.indexOf("=");
    if (index === -1) {
      continue;
    }

    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function buildInterfacesFile(): string {
  return "";
}

void main();
