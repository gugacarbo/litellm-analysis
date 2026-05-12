---
name: artificial-analysis
description: >
  FETCH REAL AI MODEL BENCHMARKS from Artificial Analysis API (500+ models). ALWAYS use this when the user asks to: compare AI model intelligence, find best model for price/performance, check model speed/latency/pricing, rank LLMs by benchmarks, get independent model evaluations, or decide which model to use for a task. Trigger keywords: "benchmark", "intelligence index", "model comparison", "tokens per second", "model pricing", "which model", "best model", "compare models", "AA index", "artificial analysis", "speed vs quality", "model latency", "cheapest model", "smartest model", "model ranking", "recommend a model". Even if the user just says "compare GPT and Claude" or "what's the best model for X", use this skill — it has real data from independent evaluations, not guesses.
compatibility:
  - webfetch
  - bash
---

# Artificial Analysis API Skill

This skill provides access to independent AI model benchmarks from [Artificial Analysis](https://artificialanalysis.ai/). It uses the free tier API (1,000 requests/day) to fetch LLM benchmark data.

## API Overview

- **Base URL:** `https://artificialanalysis.ai/api/v2`
- **Auth:** API key via `x-api-key` header
- **Rate limit:** 1,000 requests/day (free tier)
- **Attribution required:** Always cite `https://artificialanalysis.ai/` when sharing data from this API

### Key endpoint for this skill

| Endpoint                | Description                                              |
| ----------------------- | -------------------------------------------------------- |
| `GET /data/llms/models` | All LLM models with evaluations, pricing, speed, latency |

### LLM response fields

Each model in the response contains:

| Field                                | Type   | Description                                                                         |
| ------------------------------------ | ------ | ----------------------------------------------------------------------------------- |
| `id`                                 | string | Stable unique identifier                                                            |
| `name`                               | string | Model display name                                                                  |
| `slug`                               | string | URL-friendly identifier                                                             |
| `model_creator`                      | object | `{ id, name, slug }` — the lab/provider                                             |
| `evaluations`                        | object | Benchmark scores (intelligence index, coding, math, etc.)                           |
| `pricing`                            | object | `{ price_1m_input_tokens, price_1m_output_tokens, price_1m_blended_3_to_1 }` in USD |
| `median_output_tokens_per_second`    | number | Speed                                                                               |
| `median_time_to_first_token_seconds` | number | Latency                                                                             |
| `median_time_to_first_answer_token`  | number | Time to first answer token                                                          |

### Evaluation fields (inside `evaluations`)

| Field                                    | Description                                    |
| ---------------------------------------- | ---------------------------------------------- |
| `artificial_analysis_intelligence_index` | Composite intelligence score (higher = better) |
| `artificial_analysis_coding_index`       | Coding capability score                        |
| `artificial_analysis_math_index`         | Math capability score                          |
| `mmlu_pro`                               | MMLU-Pro benchmark                             |
| `gpqa`                                   | GPQA Diamond benchmark                         |
| `hle`                                    | Humanity's Last Exam                           |
| `livecodebench`                          | LiveCodeBench                                  |
| `scicode`                                | SciCode                                        |
| `math_500`                               | MATH-500                                       |
| `aime`                                   | AIME (math competition)                        |

## Setup

### 1. API Key

On first use, the user needs an API key. Guide them through:

1. Go to https://artificialanalysis.ai/ and create an account
2. Navigate to the Insights Platform to generate an API key
3. The skill stores the key in `.env` file within the skill directory

Ask the user for consent before storing the key. If they consent, create a `.env` file:

```
ARTIFICIAL_ANALYSIS_API_KEY=sk-your-key-here
```

Then create/update `.gitignore` in the skill directory to include `.env`.

### 2. Loading the API Key

Always load the API key from the `.env` file:

```bash
export $(grep -v '^#' /path/to/skill/.env | xargs)
```

If no `.env` file exists, ask the user to provide their API key.

## Workflow

### Step 1: Fetch LLM data

```bash
./scripts/fetch-models.sh > .cache/models.json
```

This script:
- loads `ARTIFICIAL_ANALYSIS_API_KEY` from `.env` (or env var),
- enforces configurable local rate limiting,
- enforces a minimum total response time,
- reads/writes `.cache/models.json` by default.

The API returns a JSON object with a `data` array containing all models.

**Defaults:**
- `RATE_LIMIT_QPM=5` (5 requests/minute)
- `MIN_RESPONSE_SECONDS=1` (minimum total runtime per invocation)

**Examples:**
```bash
# default behavior (uses cache if present)
./scripts/fetch-models.sh > .cache/models.json

# force API refresh (ignores existing cache)
./scripts/fetch-models.sh --force-refresh > .cache/models.json

# custom rate + minimum response time
RATE_LIMIT_QPM=10 MIN_RESPONSE_SECONDS=1.5 ./scripts/fetch-models.sh --force-refresh > .cache/models.json
```

### Step 2: Analyze the data

Use bash (with `jq`) to filter, sort, and analyze the model data:

**Top N models by intelligence score:**
```bash
echo "$data" | jq '[.data[] | select(.evaluations.artificial_analysis_intelligence_index != null)] | sort_by(.evaluations.artificial_analysis_intelligence_index) | reverse[:5] | .[] | {name, creator: .model_creator.name, intelligence: .evaluations.artificial_analysis_intelligence_index, speed: .median_output_tokens_per_second, price_input: .pricing.price_1m_input_tokens, price_output: .pricing.price_1m_output_tokens}'
```

**Best value (intelligence / price ratio):**
```bash
echo "$data" | jq '[.data[] | select(.evaluations.artificial_analysis_intelligence_index != null and .pricing.price_1m_blended_3_to_1 > 0)] | .[] | {name, creator: .model_creator.name, intelligence: .evaluations.artificial_analysis_intelligence_index, price_blended: .pricing.price_1m_blended_3_to_1, value_ratio: (.evaluations.artificial_analysis_intelligence_index / .pricing.price_1m_blended_3_to_1)} | sort_by(.value_ratio) | reverse[:10]'
```

**Filter by model creator/provider:**
```bash
echo "$data" | jq '[.data[] | select(.model_creator.name == "OpenAI")] | sort_by(.evaluations.artificial_analysis_intelligence_index) | reverse'
```

**Search by model name:**
```bash
echo "$data" | jq '[.data[] | select(.name | test("claude"; "i"))]'
```

**Fastest models:**
```bash
echo "$data" | jq '[.data[] | select(.median_output_tokens_per_second != null)] | sort_by(.median_output_tokens_per_second) | reverse[:10] | .[] | {name, creator: .model_creator.name, speed: .median_output_tokens_per_second}'
```

### Step 3: Present results

When presenting data to the user, always:

1. **Attribute the source:** "Data from [Artificial Analysis](https://artificialanalysis.ai/)"
2. **Format numbers clearly:**
   - Intelligence scores: whole numbers or 1 decimal place
   - Pricing: `$X.XX/M tokens` format
   - Speed: `X tokens/sec`
   - Latency: `X.X seconds`
3. **Provide context:** Explain what the metrics mean (e.g., "The Artificial Analysis Intelligence Index is a composite of 10 evaluations")
4. **Highlight tradeoffs:** If a model is cheap but scores lower, say so

### Step 4: Handle errors

| Error              | Likely cause                  | Action                                                                                 |
| ------------------ | ----------------------------- | -------------------------------------------------------------------------------------- |
| HTTP 401           | Invalid or missing API key    | Check `.env` file, ask user to regenerate key                                          |
| HTTP 429           | Rate limit exhausted (1k/day) | **STOP retrying.** Use web search or cached data instead. The key will reset next day. |
| HTTP 500           | Server error                  | Retry once, if persists notify user                                                    |
| Empty `data` array | No models match filter        | Broaden the search criteria                                                            |

## Rate limit best practices

- **Use the built-in script limiter.** `scripts/fetch-models.sh` throttles locally by QPM and tracks request timestamps in `.cache/rate-limit-state.tsv`.
- **Cache aggressively.** Use `.cache/models.json` for subsequent analysis in the same session.
- Only re-fetch if the user explicitly asks for updated data.
- The free tier allows **1,000 requests/day** — each full fetch counts as 1 request. If you get HTTP 429, do NOT keep retrying. Fall back immediately:
  1. Check if `.cache/models.json` exists and use it
  2. If not cached, use web search for the specific data needed
  3. Inform the user the API is rate-limited and suggest waiting or using a fresh key

## Attribution

All uses of this API require attribution to:
**[Artificial Analysis](https://artificialanalysis.ai/)** — Independent AI benchmarking & analysis

Include attribution in the response whenever presenting benchmark data.
