import { describe, expect, it } from "vitest";
import {
  deriveCostFields,
  deriveUsageFields,
  isLedgerOwnedRow,
  type LegacyErrorRow,
  type LegacySpendRow,
  legacySpendRowFromCloudJson,
  mapLegacySpendToProxyRequest,
  mapLegacyStatus,
  parseLegacyMessages,
  shouldSkipExistingRow,
} from "../legacy-spend-adapter.js";

function createSpend(overrides: Partial<LegacySpendRow> = {}): LegacySpendRow {
  return {
    requestId: "req-1",
    spend: 0.002,
    totalTokens: 300,
    promptTokens: 200,
    completionTokens: 100,
    startTime: new Date("2026-01-01T10:00:00.000Z"),
    endTime: new Date("2026-01-01T10:00:01.500Z"),
    requestDurationMs: 1500,
    completionStartTime: new Date("2026-01-01T10:00:00.400Z"),
    model: "gpt-test",
    apiBase: "https://api.example.com/v1",
    status: "success",
    messages: [{ role: "user", content: "hello" }],
    response: { choices: [{ message: { content: "hi" } }] },
    proxyServerRequest: { model: "gpt-test", messages: [] },
    metadata: {},
    ...overrides,
  };
}

function createError(overrides: Partial<LegacyErrorRow> = {}): LegacyErrorRow {
  return {
    requestId: "req-1",
    startTime: new Date("2026-01-01T10:00:00.000Z"),
    endTime: new Date("2026-01-01T10:00:00.500Z"),
    apiBase: "https://api.example.com/v1",
    modelGroup: "gpt-test",
    litellmModelName: "gpt-4o-mini",
    modelId: "model-1",
    requestKwargs: { temperature: 0.2 },
    exceptionType: "RateLimitError",
    exceptionString: "Rate limit exceeded for model",
    statusCode: "429",
    ...overrides,
  };
}

describe("legacy-spend-adapter", () => {
  it("maps spend row to native proxy request fields", () => {
    const mapped = mapLegacySpendToProxyRequest({
      spend: createSpend(),
      modelRates: {
        inputCostPerToken: 0.000001,
        outputCostPerToken: 0.000002,
      },
    });

    expect(mapped.request.id).toBe("req-1");
    expect(mapped.request.model).toBe("gpt-test");
    expect(mapped.request.upstreamModel).toBe("gpt-test");
    expect(mapped.request.status).toBe("success");
    expect(mapped.request.latencyMs).toBe(1500);
    expect(mapped.request.ttftMs).toBe(400);
    expect(mapped.request.inputTokens).toBe(200);
    expect(mapped.request.outputTokens).toBe(100);
    expect(mapped.request.totalCost).toBe(0.002);
    expect(mapped.request.costEstimated).toBe(false);
    expect(mapped.request.errorDetails).toEqual({ source: "litellm-import" });
    expect(mapped.messages).toHaveLength(1);
    expect(mapped.messages[0]?.role).toBe("user");
  });

  it("merges error log fields into the same request row", () => {
    const mapped = mapLegacySpendToProxyRequest({
      spend: createSpend({ status: "failure" }),
      error: createError(),
    });

    expect(mapped.request.status).toBe("failed");
    expect(mapped.request.errorType).toBe("RateLimitError");
    expect(mapped.request.errorStatusCode).toBe(429);
    expect(mapped.request.errorMessage).toBe("Rate limit exceeded for model");
    expect(mapped.request.upstreamModel).toBe("gpt-4o-mini");
    expect(mapped.request.errorDetails).toMatchObject({
      source: "litellm-import",
      litellm_model_name: "gpt-4o-mini",
      model_group: "gpt-test",
    });
  });

  it("creates minimal failed row from orphan error log", () => {
    const mapped = mapLegacySpendToProxyRequest({
      error: createError({ requestId: "err-only" }),
    });

    expect(mapped.request.id).toBe("err-only");
    expect(mapped.request.status).toBe("failed");
    expect(mapped.request.model).toBe("gpt-test");
    expect(mapped.request.usageEstimated).toBe(true);
    expect(mapped.request.costEstimated).toBe(true);
    expect(mapped.messages).toHaveLength(0);
  });

  it("marks usage and cost estimated when spend is missing but tokens exist", () => {
    const usage = deriveUsageFields(
      createSpend({
        spend: 0,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 120,
      }),
    );
    const cost = deriveCostFields(
      createSpend({
        spend: 0,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 120,
      }),
      usage,
      { inputCostPerToken: 0.000001, outputCostPerToken: 0.000002 },
    );

    expect(usage.usageEstimated).toBe(true);
    expect(cost.costEstimated).toBe(true);
    expect(cost.totalCost).toBeNull();
  });

  it("derives latency and ttft from timestamps when duration columns are absent", () => {
    const spend = createSpend({
      requestDurationMs: null,
      completionStartTime: new Date("2026-01-01T10:00:00.250Z"),
      endTime: new Date("2026-01-01T10:00:02.000Z"),
    });

    const mapped = mapLegacySpendToProxyRequest({ spend });

    expect(mapped.request.latencyMs).toBe(2000);
    expect(mapped.request.ttftMs).toBe(250);
  });

  it("maps cloud JSON payloads into spend rows", () => {
    const spend = legacySpendRowFromCloudJson({
      request_id: "cloud-1",
      spend: 0.01,
      total_tokens: 50,
      prompt_tokens: 30,
      completion_tokens: 20,
      startTime: "2026-02-01T12:00:00.000Z",
      endTime: "2026-02-01T12:00:01.000Z",
      model: "cloud-model",
      status: "success",
      messages: [{ role: "user", content: "ping" }],
    });

    expect(spend?.requestId).toBe("cloud-1");
    expect(spend?.model).toBe("cloud-model");
    expect(parseLegacyMessages("cloud-1", spend?.messages)).toHaveLength(1);
  });

  it("skips non-import ledger rows during idempotency checks", () => {
    const ledgerRow = {
      status: "success",
      errorDetails: null,
    };
    const importRow = {
      status: "success",
      errorDetails: { source: "litellm-import" },
    };

    expect(isLedgerOwnedRow(ledgerRow)).toBe(true);
    expect(shouldSkipExistingRow(ledgerRow, false)).toBe(true);
    expect(shouldSkipExistingRow(ledgerRow, true)).toBe(true);
    expect(shouldSkipExistingRow(importRow, false)).toBe(true);
    expect(shouldSkipExistingRow(importRow, true)).toBe(false);
  });

  it("maps timeout and cancelled statuses", () => {
    expect(mapLegacyStatus(createSpend({ status: "timeout" }), null)).toBe(
      "timeout",
    );
    expect(
      mapLegacyStatus(
        createSpend({ status: null, metadata: { status: "cancelled" } }),
        null,
      ),
    ).toBe("cancelled");
  });
});
