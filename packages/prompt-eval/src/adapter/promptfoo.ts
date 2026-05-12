import type {
  AiReviewFinding,
  AiReviewSuggestion,
  ClassifyInput,
  ClassifyOutput,
  EvalAdapterOptions,
  PromptEvalAdapter,
  ReviewInput,
  ReviewOutput,
} from "../types/index.js";

type ChatRole = "system" | "user";

interface ChatMessage {
  role: ChatRole;
  content: string;
}

interface ChatCompletionsRequest {
  model: string;
  messages: ChatMessage[];
  temperature: number;
}

function toStringError(value: unknown): string {
  return value instanceof Error ? value.message : String(value);
}

function normalizeBaseUrl(baseUrl: string): string {
  const trimmed = baseUrl.trim().replace(/\/+$/, "");
  if (
    trimmed.endsWith("/chat/completions") ||
    trimmed.endsWith("/v1/chat/completions")
  ) {
    return trimmed;
  }
  if (trimmed.endsWith("/v1")) {
    return `${trimmed}/chat/completions`;
  }
  return `${trimmed}/chat/completions`;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function extractTextContent(content: unknown): string {
  if (typeof content === "string") {
    return content;
  }

  if (!Array.isArray(content)) {
    return "";
  }

  const parts: string[] = [];
  for (const item of content) {
    if (isObject(item) && typeof item.text === "string") {
      parts.push(item.text);
    }
  }

  return parts.join("\n");
}

function extractFirstChoiceContent(payload: unknown): string {
  if (!isObject(payload) || !Array.isArray(payload.choices)) {
    return "";
  }

  const firstChoice = payload.choices[0];
  if (!isObject(firstChoice) || !isObject(firstChoice.message)) {
    return "";
  }

  return extractTextContent(firstChoice.message.content);
}

function tryParseJsonObject(rawText: string): Record<string, unknown> | null {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const parsed = JSON.parse(trimmed);
    return isObject(parsed) ? parsed : null;
  } catch {
    // Continue with relaxed parsing.
  }

  const fencedMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fencedMatch?.[1]) {
    try {
      const parsed = JSON.parse(fencedMatch[1].trim());
      return isObject(parsed) ? parsed : null;
    } catch {
      // Continue with object-slice parsing.
    }
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const jsonSlice = trimmed.slice(firstBrace, lastBrace + 1);
    try {
      const parsed = JSON.parse(jsonSlice);
      return isObject(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  return null;
}

function toCategoryArray(
  value: unknown,
  allowedCategoryIds: Set<string>,
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const unique: string[] = [];
  const seen = new Set<string>();

  for (const item of value) {
    if (typeof item !== "string") {
      continue;
    }
    const id = item.trim();
    if (!allowedCategoryIds.has(id) || seen.has(id)) {
      continue;
    }
    seen.add(id);
    unique.push(id);
  }

  return unique;
}

function fallbackClassifyFromText(
  rawText: string,
  categories: ClassifyInput["categories"],
): string[] {
  const predicted: string[] = [];
  const lowered = rawText.toLowerCase();

  for (const category of categories) {
    if (lowered.includes(category.id.toLowerCase())) {
      predicted.push(category.id);
    }
  }

  return predicted;
}

function sanitizeFindings(
  value: unknown,
  input: ReviewInput,
): AiReviewFinding[] {
  if (!Array.isArray(value)) {
    return input.cases.map((c) => ({
      caseId: c.caseId,
      input: c.input,
      expected: c.expectedCategories,
      predicted: c.predictedCategories,
      assessment: c.expectedCategories.some((expected) =>
        c.predictedCategories.includes(expected),
      )
        ? "correct"
        : "incorrect",
      reasoning: "Generated with fallback parser.",
    }));
  }

  const inputByCaseId = new Map(input.cases.map((c) => [c.caseId, c]));
  const normalized: AiReviewFinding[] = [];

  for (const candidate of value) {
    if (!isObject(candidate)) {
      continue;
    }
    const caseId =
      typeof candidate.caseId === "string" ? candidate.caseId : undefined;
    if (!caseId) {
      continue;
    }
    const source = inputByCaseId.get(caseId);
    if (!source) {
      continue;
    }

    const expected = Array.isArray(candidate.expected)
      ? candidate.expected.filter((item) => typeof item === "string")
      : source.expectedCategories;

    const predicted = Array.isArray(candidate.predicted)
      ? candidate.predicted.filter((item) => typeof item === "string")
      : source.predictedCategories;

    const assessment =
      candidate.assessment === "correct" ||
      candidate.assessment === "incorrect" ||
      candidate.assessment === "ambiguous"
        ? candidate.assessment
        : source.expectedCategories.some((id) => predicted.includes(id))
          ? "correct"
          : "incorrect";

    normalized.push({
      caseId,
      input:
        typeof candidate.input === "string" ? candidate.input : source.input,
      expected,
      predicted,
      assessment,
      reasoning:
        typeof candidate.reasoning === "string" && candidate.reasoning.trim()
          ? candidate.reasoning
          : "Model did not provide detailed reasoning.",
    });
  }

  if (normalized.length > 0) {
    return normalized;
  }

  return input.cases.map((c) => ({
    caseId: c.caseId,
    input: c.input,
    expected: c.expectedCategories,
    predicted: c.predictedCategories,
    assessment: c.expectedCategories.some((expected) =>
      c.predictedCategories.includes(expected),
    )
      ? "correct"
      : "incorrect",
    reasoning: "Generated with fallback parser.",
  }));
}

function sanitizeSuggestions(value: unknown): AiReviewSuggestion[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const suggestions: AiReviewSuggestion[] = [];
  for (const candidate of value) {
    if (!isObject(candidate)) {
      continue;
    }
    if (
      typeof candidate.categoryId !== "string" ||
      typeof candidate.currentDescription !== "string" ||
      typeof candidate.suggestedDescription !== "string" ||
      typeof candidate.rationale !== "string"
    ) {
      continue;
    }
    suggestions.push({
      categoryId: candidate.categoryId,
      currentDescription: candidate.currentDescription,
      suggestedDescription: candidate.suggestedDescription,
      rationale: candidate.rationale,
    });
  }
  return suggestions;
}

async function runChatCompletion(
  options: EvalAdapterOptions,
  request: ChatCompletionsRequest,
  signal?: AbortSignal,
): Promise<string> {
  if (options.provider !== "litellm") {
    return "";
  }

  if (!options.baseUrl?.trim()) {
    throw new Error(
      "EVAL_BASE_URL (or LITELLM_API_URL fallback) is required for litellm provider.",
    );
  }
  if (!options.apiKey?.trim()) {
    throw new Error(
      "EVAL_API_KEY (or LITELLM_API_KEY fallback) is required for litellm provider.",
    );
  }

  const url = normalizeBaseUrl(options.baseUrl);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${options.apiKey}`,
    },
    body: JSON.stringify(request),
    signal,
  });

  const responseText = await response.text();
  if (!response.ok) {
    throw new Error(
      `LiteLLM classify/review failed (${response.status}): ${responseText.slice(0, 500)}`,
    );
  }

  try {
    const payload = JSON.parse(responseText) as unknown;
    return extractFirstChoiceContent(payload);
  } catch (error) {
    throw new Error(
      `Failed to parse LiteLLM response JSON: ${toStringError(error)}`,
    );
  }
}

export function createPromptfooAdapter(
  options: EvalAdapterOptions,
): PromptEvalAdapter {
  const provider = options.provider.trim().toLowerCase();

  return {
    async classify(input: ClassifyInput): Promise<ClassifyOutput> {
      input.signal?.throwIfAborted();

      const start = Date.now();
      const allowedCategoryIds = new Set(input.categories.map((c) => c.id));

      if (provider !== "litellm") {
        const predictedCategories =
          input.categories.length > 0 ? [input.categories[0].id] : [];
        return {
          predictedCategories,
          rawResponse: JSON.stringify({ categories: predictedCategories }),
          latencyMs: Date.now() - start,
        };
      }

      const categoriesBlock = input.categories
        .map((category) => {
          const description = category.description.trim();
          return `- ${category.id}: ${description}`;
        })
        .join("\n");

      const modelContent = await runChatCompletion(
        { ...options, provider },
        {
          model: input.model,
          temperature: 0,
          messages: [
            {
              role: "system",
              content:
                "You are a strict multi-label classifier. Return JSON only.",
            },
            {
              role: "user",
              content: [
                "Classify the prompt into zero or more category IDs.",
                "Return EXACTLY this JSON object shape:",
                '{"categories":["id1","id2"]}',
                "Use only IDs from the list below.",
                "",
                "Categories:",
                categoriesBlock,
                "",
                "Prompt:",
                input.prompt,
              ].join("\n"),
            },
          ],
        },
        input.signal,
      );

      const parsed = tryParseJsonObject(modelContent);
      const predictedFromJson = toCategoryArray(
        parsed?.categories,
        allowedCategoryIds,
      );
      const predictedCategories =
        predictedFromJson.length > 0
          ? predictedFromJson
          : fallbackClassifyFromText(modelContent, input.categories);

      return {
        predictedCategories,
        rawResponse: modelContent,
        latencyMs: Date.now() - start,
      };
    },

    async review(input: ReviewInput): Promise<ReviewOutput> {
      input.signal?.throwIfAborted();

      if (provider !== "litellm") {
        return {
          findings: input.cases.map((c) => ({
            caseId: c.caseId,
            input: c.input,
            expected: c.expectedCategories,
            predicted: c.predictedCategories,
            assessment: c.expectedCategories.some((e) =>
              c.predictedCategories.includes(e),
            )
              ? ("correct" as const)
              : ("incorrect" as const),
            reasoning: "Stub review — Promptfoo integration pending",
          })),
          suggestions: [],
        };
      }

      const casesPayload = input.cases.map((c) => ({
        caseId: c.caseId,
        input: c.input,
        expected: c.expectedCategories,
        predicted: c.predictedCategories,
        categories: c.categories.map((cat) => ({
          id: cat.id,
          name: cat.name,
          description: cat.description,
        })),
      }));

      const modelContent = await runChatCompletion(
        { ...options, provider },
        {
          model: input.model,
          temperature: 0,
          messages: [
            {
              role: "system",
              content:
                "You are an evaluation reviewer. Return JSON only and stay concise.",
            },
            {
              role: "user",
              content: [
                "Review these classification results and return EXACTLY this JSON object shape:",
                '{"findings":[{"caseId":"...","input":"...","expected":["..."],"predicted":["..."],"assessment":"correct|incorrect|ambiguous","reasoning":"..."}],"suggestions":[{"categoryId":"...","currentDescription":"...","suggestedDescription":"...","rationale":"..."}]}',
                "",
                "Cases:",
                JSON.stringify(casesPayload),
              ].join("\n"),
            },
          ],
        },
        input.signal,
      );

      const parsed = tryParseJsonObject(modelContent);

      return {
        findings: sanitizeFindings(parsed?.findings, input),
        suggestions: sanitizeSuggestions(parsed?.suggestions),
      };
    },
  };
}
