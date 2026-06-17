import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ModelProxyService } from "./service";

function createProviderServiceMock() {
  return {
    getAll: vi.fn().mockResolvedValue({
      "local-proxy": {
        name: "Local Model Proxy",
        ownedBy: "lite-llm-analytics",
        baseUrl: "http://localhost:3008/v1",
        apiKey: "env:MODEL_PROXY_API_KEY",
        defaultCredential: "router",
      },
    }),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
  };
}

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
  let requestStatus = "started";
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
      findUnique: vi
        .fn()
        .mockImplementation(() =>
          Promise.resolve({ id: "req_1", status: requestStatus }),
        ),
      update: vi
        .fn()
        .mockImplementation((args: { data: { status?: string } }) => {
          if (args.data.status) {
            requestStatus = args.data.status;
          }
          return Promise.resolve(undefined);
        }),
    },
    modelProxyMessage: {
      createMany: vi.fn().mockResolvedValue(undefined),
    },
  };
}

describe("ModelProxyService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

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
      providerService: createProviderServiceMock() as never,
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
      providerService: createProviderServiceMock() as never,
      now: (() => {
        const times = [
          new Date("2026-06-16T00:00:00.000Z"),
          new Date("2026-06-16T00:00:00.100Z"),
        ];
        return () => times.shift() ?? new Date("2026-06-16T00:00:00.100Z");
      })(),
    });

    await service.createChatCompletion(
      {
        model: "gpt-test",
        stream: false,
        messages: [{ role: "user", content: "hello" }],
        user: "alice",
      },
      undefined,
      { apiKeyAlias: "test-key" },
    );

    expect(fetchFn).toHaveBeenCalledOnce();
    expect(vi.mocked(database.modelProxyRequest.create).mock.calls[0]).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          data: expect.objectContaining({
            apiKeyAlias: "test-key",
            endUser: "alice",
          }),
        }),
      ]),
    );
    const updateCall = vi.mocked(database.modelProxyRequest.update).mock
      .calls[0];
    expect(updateCall?.[0]).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "success",
          inputTokens: 10,
          outputTokens: 5,
          totalTokens: 15,
          totalCost: expect.closeTo(0.00002, 8),
          estimatedCostUsd: expect.closeTo(0.00002, 8),
          upstreamRequestId: "chatcmpl_1",
        }),
      }),
    );
  });

  it("records TTFT and usage for streaming requests", async () => {
    const database = createDatabaseMock();
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            'data: {"id":"chatcmpl_stream","usage":{"prompt_tokens":4,"completion_tokens":2,"total_tokens":6}}\n\n',
          ),
        );
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
        controller.close();
      },
    });

    const fetchFn = vi.fn().mockResolvedValue(
      new Response(stream, {
        status: 200,
        headers: { "content-type": "text/event-stream" },
      }),
    );

    const times = [
      new Date("2026-06-16T00:00:00.000Z"),
      new Date("2026-06-16T00:00:00.050Z"),
      new Date("2026-06-16T00:00:00.200Z"),
    ];

    const service = new ModelProxyService({
      database: database as never,
      fetchFn: fetchFn as never,
      modelsService: createModelServiceMock() as never,
      providerService: createProviderServiceMock() as never,
      now: () => times.shift() ?? new Date("2026-06-16T00:00:00.200Z"),
    });

    const response = await service.createStreamingChatCompletion({
      model: "gpt-test",
      stream: true,
      messages: [{ role: "user", content: "hello" }],
    });

    const reader = response.body.getReader();
    while (!(await reader.read()).done) {
      // drain stream
    }

    const updateCall = vi.mocked(database.modelProxyRequest.update).mock
      .calls[0];
    expect(updateCall?.[0]?.data).toEqual(
      expect.objectContaining({
        status: "success",
        ttftMs: 50,
        inputTokens: 4,
        outputTokens: 2,
        totalTokens: 6,
        upstreamRequestId: "chatcmpl_stream",
      }),
    );
  });

  it("records failed upstream responses with structured errors", async () => {
    const database = createDatabaseMock();
    const fetchFn = vi.fn().mockResolvedValue(
      new Response("upstream exploded", {
        status: 502,
        headers: { "content-type": "text/plain" },
      }),
    );

    const service = new ModelProxyService({
      database: database as never,
      fetchFn: fetchFn as never,
      modelsService: createModelServiceMock() as never,
      providerService: createProviderServiceMock() as never,
      now: () => new Date("2026-06-16T00:00:00.000Z"),
    });

    await expect(
      service.createChatCompletion({
        model: "gpt-test",
        stream: false,
        messages: [{ role: "user", content: "hello" }],
      }),
    ).rejects.toThrow(/upstream failed/);

    expect(database.modelProxyRequest.update).toHaveBeenCalledOnce();
    const updateCall = vi.mocked(database.modelProxyRequest.update).mock
      .calls[0];
    expect(updateCall?.[0]?.data).toEqual(
      expect.objectContaining({
        status: "failed",
        errorType: "upstream_http_error",
        errorStatusCode: 502,
      }),
    );
  });

  it("records timeout status when upstream aborts by timeout", async () => {
    const database = createDatabaseMock();
    const fetchFn = vi.fn().mockRejectedValue(
      Object.assign(new Error("The operation timed out."), {
        name: "TimeoutError",
      }),
    );

    const service = new ModelProxyService({
      database: database as never,
      fetchFn: fetchFn as never,
      modelsService: createModelServiceMock() as never,
      providerService: createProviderServiceMock() as never,
      now: () => new Date("2026-06-16T00:00:00.000Z"),
    });

    await expect(
      service.createChatCompletion({
        model: "gpt-test",
        stream: false,
        messages: [{ role: "user", content: "hello" }],
      }),
    ).rejects.toThrow(/timed out/);

    const updateCall = vi.mocked(database.modelProxyRequest.update).mock
      .calls[0];
    expect(updateCall?.[0]?.data).toEqual(
      expect.objectContaining({
        status: "timeout",
        errorType: "timeout",
      }),
    );
  });

  it("records cancelled status when request is aborted", async () => {
    const database = createDatabaseMock();
    const fetchFn = vi.fn().mockImplementation((_url, init) => {
      return new Promise((_resolve, reject) => {
        const signal = init?.signal;
        if (signal?.aborted) {
          reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
          return;
        }
        signal?.addEventListener("abort", () => {
          reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
        });
      });
    });

    const service = new ModelProxyService({
      database: database as never,
      fetchFn: fetchFn as never,
      modelsService: createModelServiceMock() as never,
      providerService: createProviderServiceMock() as never,
      now: () => new Date("2026-06-16T00:00:00.000Z"),
    });

    const controller = new AbortController();
    const requestPromise = service.createChatCompletion(
      {
        model: "gpt-test",
        stream: false,
        messages: [{ role: "user", content: "hello" }],
      },
      controller.signal,
    );
    await Promise.resolve();
    controller.abort();

    await expect(requestPromise).rejects.toThrow();

    const updateCall = vi.mocked(database.modelProxyRequest.update).mock
      .calls[0];
    expect(updateCall?.[0]?.data).toEqual(
      expect.objectContaining({
        status: "cancelled",
        errorType: "cancelled",
      }),
    );
  });

  it("redacts secrets in persisted request payloads", async () => {
    const database = createDatabaseMock();
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "chatcmpl_1",
          usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
          choices: [
            { index: 0, message: { role: "assistant", content: "ok" } },
          ],
        }),
        { status: 200 },
      ),
    );

    const service = new ModelProxyService({
      database: database as never,
      fetchFn: fetchFn as never,
      modelsService: createModelServiceMock() as never,
      providerService: createProviderServiceMock() as never,
      now: () => new Date("2026-06-16T00:00:00.000Z"),
    });

    await service.createChatCompletion({
      model: "gpt-test",
      stream: false,
      messages: [
        { role: "user", content: "token sk-abcdefghijklmnopqrst here" },
      ],
    });

    const createCall = vi.mocked(database.modelProxyRequest.create).mock
      .calls[0];
    expect(createCall?.[0]?.data.requestBody).toEqual(
      expect.objectContaining({
        messages: [{ role: "user", content: "token [REDACTED] here" }],
      }),
    );
  });

  it("keeps cost snapshot immutable when model pricing changes later", async () => {
    const database = createDatabaseMock();
    vi.mocked(database.modelProxyModel.findUnique).mockResolvedValue({
      modelName: "gpt-test",
      enabled: true,
      upstreamBaseUrl: "https://upstream.example.com/v1",
      upstreamModel: null,
      inputCostPerToken: 0.000001,
      outputCostPerToken: 0.000002,
      ownedBy: null,
      family: null,
      displayName: null,
      credentialName: "default",
      secretRef: null,
      updatedAt: new Date("2026-06-16T00:00:00.000Z"),
    });

    const fetchFn = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "chatcmpl_1",
          usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
          choices: [
            { index: 0, message: { role: "assistant", content: "ok" } },
          ],
        }),
        { status: 200 },
      ),
    );

    const service = new ModelProxyService({
      database: database as never,
      fetchFn: fetchFn as never,
      modelsService: createModelServiceMock() as never,
      providerService: createProviderServiceMock() as never,
      now: () => new Date("2026-06-16T00:00:00.000Z"),
    });

    await service.createChatCompletion({
      model: "gpt-test",
      stream: false,
      messages: [{ role: "user", content: "hello" }],
    });

    const updateCall = vi.mocked(database.modelProxyRequest.update).mock
      .calls[0];
    expect(updateCall?.[0]?.data).toEqual(
      expect.objectContaining({
        inputCostPerToken: 0.000001,
        outputCostPerToken: 0.000002,
        totalCost: expect.closeTo(0.00002, 8),
      }),
    );
  });

  it("notifies listeners when a request finishes", async () => {
    const database = createDatabaseMock();
    const listener = vi.fn();
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "chatcmpl_1",
          usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
          choices: [
            { index: 0, message: { role: "assistant", content: "ok" } },
          ],
        }),
        { status: 200 },
      ),
    );

    const service = new ModelProxyService({
      database: database as never,
      fetchFn: fetchFn as never,
      modelsService: createModelServiceMock() as never,
      providerService: createProviderServiceMock() as never,
      now: () => new Date("2026-06-16T00:00:00.000Z"),
    });

    service.onRequestFinished(listener);

    await service.createChatCompletion({
      model: "gpt-test",
      stream: false,
      messages: [{ role: "user", content: "hello" }],
    });

    expect(listener).toHaveBeenCalledWith("req_1");
  });

  it("records cancelled status when a streaming client disconnects", async () => {
    const database = createDatabaseMock();
    const encoder = new TextEncoder();
    let upstreamSignal: AbortSignal | undefined;

    const fetchFn = vi.fn().mockImplementation((_url, init) => {
      upstreamSignal = init?.signal;
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            encoder.encode('data: {"id":"chatcmpl_stream"}\n\n'),
          );
          const abortListener = () => {
            controller.error(
              Object.assign(new Error("aborted"), { name: "AbortError" }),
            );
          };
          if (upstreamSignal?.aborted) {
            abortListener();
            return;
          }
          upstreamSignal?.addEventListener("abort", abortListener, {
            once: true,
          });
        },
      });

      return Promise.resolve(
        new Response(stream, {
          status: 200,
          headers: { "content-type": "text/event-stream" },
        }),
      );
    });

    const service = new ModelProxyService({
      database: database as never,
      fetchFn: fetchFn as never,
      modelsService: createModelServiceMock() as never,
      providerService: createProviderServiceMock() as never,
      now: () => new Date("2026-06-16T00:00:00.000Z"),
    });

    const response = await service.createStreamingChatCompletion({
      model: "gpt-test",
      stream: true,
      messages: [{ role: "user", content: "hello" }],
    });

    const reader = response.body.getReader();
    await reader.read();
    await reader.cancel();

    await vi.waitFor(() => {
      expect(database.modelProxyRequest.update).toHaveBeenCalledOnce();
    });

    expect(upstreamSignal?.aborted).toBe(true);
    const updateCall = vi.mocked(database.modelProxyRequest.update).mock
      .calls[0];
    expect(updateCall?.[0]?.data).toEqual(
      expect.objectContaining({
        status: "cancelled",
        errorType: "cancelled",
      }),
    );
  });
});
