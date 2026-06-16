import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ModelProxyService } from "./service";

function createModelServiceMock() {
  return {
    getAll: vi.fn().mockResolvedValue({
      "gpt-test": {
        enabled: true,
        displayName: "GPT Test",
        ownedBy: "openai",
        family: "gpt",
        limits: { length: 128000, maxOutput: 4096 },
        cost: {
          input: 0.000001,
          output: 0.000002,
        },
      },
    }),
  };
}

function createDatabaseMock() {
  return {
    modelProxyModel: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue({
        modelName: "gpt-test",
        enabled: true,
        upstreamBaseUrl: "https://upstream.example.com/v1",
        upstreamModel: null,
        inputCostPerToken: null,
        outputCostPerToken: null,
        ownedBy: null,
        family: null,
        displayName: null,
        credentialName: "default",
        secretRef: null,
        updatedAt: new Date("2026-06-16T00:00:00.000Z"),
      }),
    },
    modelProxyCredential: {
      findUnique: vi.fn().mockResolvedValue({
        name: "default",
        apiKey: "upstream-secret",
        baseUrl: "https://upstream.example.com/v1",
        secretRef: null,
      }),
    },
    modelProxyRequest: {
      create: vi.fn().mockResolvedValue({ id: "req_1" }),
      update: vi.fn().mockResolvedValue(undefined),
    },
    modelProxyMessage: {
      createMany: vi.fn().mockResolvedValue(undefined),
    },
  };
}

describe("ModelProxyService", () => {
  it("lists fallback models when proxy registry is empty", async () => {
    const service = new ModelProxyService({
      database: {
        ...createDatabaseMock(),
        modelProxyModel: {
          findMany: vi.fn().mockResolvedValue([]),
          findUnique: vi.fn().mockResolvedValue(null),
        },
      } as never,
      fetchFn: vi.fn() as never,
      modelsService: createModelServiceMock() as never,
      now: () => new Date("2026-06-16T00:00:00.000Z"),
    });

    const response = await service.listModels();

    expect(response).toEqual({
      object: "list",
      data: [
        {
          id: "gpt-test",
          object: "model",
          created: 1781568000,
          owned_by: "openai",
        },
      ],
    });
  });

  it("records usage and cost for non-stream requests", async () => {
    const database = createDatabaseMock();
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "chatcmpl_1",
          object: "chat.completion",
          usage: {
            prompt_tokens: 10,
            completion_tokens: 5,
            total_tokens: 15,
          },
          choices: [
            {
              index: 0,
              message: { role: "assistant", content: "ok" },
            },
          ],
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      ),
    );

    const service = new ModelProxyService({
      database: database as never,
      fetchFn: fetchFn as never,
      modelsService: createModelServiceMock() as never,
      now: (() => {
        const times = [
          new Date("2026-06-16T00:00:00.000Z"),
          new Date("2026-06-16T00:00:00.100Z"),
        ];
        return () => times.shift() ?? new Date("2026-06-16T00:00:00.100Z");
      })(),
    });

    await service.createChatCompletion({
      model: "gpt-test",
      stream: false,
      messages: [{ role: "user", content: "hello" }],
    });

    expect(fetchFn).toHaveBeenCalledOnce();
    const updateCall = vi.mocked(database.modelProxyRequest.update).mock
      .calls[0];
    expect(updateCall?.[0]).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "success",
          inputTokens: 10,
          outputTokens: 5,
          totalTokens: 15,
          upstreamRequestId: "chatcmpl_1",
        }),
      }),
    );
    expect(updateCall?.[0]?.data.estimatedCostUsd).toBeCloseTo(0.00002);
  });
});
