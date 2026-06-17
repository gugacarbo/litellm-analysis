import { describe, expect, it } from "vitest";
import { presentProxyRequestLog } from "./proxy-request-log";

describe("presentProxyRequestLog", () => {
  const startedAt = new Date("2026-06-16T10:00:00.000Z");
  const finishedAt = new Date("2026-06-16T10:00:01.500Z");

  const baseRow = {
    id: "req-123",
    upstreamRequestId: "upstream-abc",
    model: "gpt-4o",
    upstreamModel: "openai/gpt-4o",
    upstreamBaseUrl: "https://api.openai.com/v1",
    status: "success",
    startedAt,
    finishedAt,
    latencyMs: 1500,
    ttftMs: 320,
    inputTokens: 120,
    outputTokens: 45,
    totalTokens: 165,
    cachedTokens: 20,
    reasoningTokens: 0,
    usageEstimated: false,
    inputCostPerToken: 0.0000025,
    outputCostPerToken: 0.00001,
    inputCost: 0.0003,
    outputCost: 0.00045,
    totalCost: 0.00075,
    costEstimated: false,
    estimatedCostUsd: null,
    errorSummary: null,
    errorType: null,
    errorMessage: null,
    errorStatusCode: null,
    errorDetails: null,
    requestBody: { model: "gpt-4o" },
    responseBody: { choices: [] },
    responseHeaders: { "content-type": "application/json" },
    messages: [
      {
        id: "msg-1",
        requestId: "req-123",
        role: "user",
        content: "hello",
        createdAt: startedAt,
      },
    ],
  };

  it("maps prisma row and messages to ProxyRequestLog", () => {
    const log = presentProxyRequestLog(baseRow);

    expect(log).toMatchObject({
      id: "req-123",
      model: "gpt-4o",
      upstream_model: "openai/gpt-4o",
      upstream_base_url: "https://api.openai.com/v1",
      status: "success",
      started_at: startedAt.toISOString(),
      finished_at: finishedAt.toISOString(),
      latency_ms: 1500,
      ttft_ms: 320,
      input_tokens: 120,
      output_tokens: 45,
      total_tokens: 165,
      cached_tokens: 20,
      usage_estimated: false,
      cost_estimated: false,
      total_cost: 0.00075,
      messages: [{ role: "user", content: "hello" }],
    });
    expect(log.error_details).toBeUndefined();
    expect(log.response_headers).toBeUndefined();
  });

  it("includes detail-only fields when requested", () => {
    const log = presentProxyRequestLog(
      {
        ...baseRow,
        errorDetails: { code: "rate_limit" },
      },
      { includeDetailFields: true },
    );

    expect(log.error_details).toEqual({ code: "rate_limit" });
    expect(log.response_headers).toEqual({
      "content-type": "application/json",
    });
  });
});
