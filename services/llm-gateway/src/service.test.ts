import {
  encryptProviderSecret,
  parseProviderEncryptionKey,
} from "@lite-llm/llm-config-service";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ModelProxyService } from "./service";

const {
  mockDbSelect,
  mockDbInsert,
  mockDbUpdate,
  createMock,
  updateMock,
  findManyMock,
} = vi.hoisted(() => ({
  mockDbSelect: vi.fn(),
  mockDbInsert: vi.fn(),
  mockDbUpdate: vi.fn(),
  createMock: vi.fn(),
  updateMock: vi.fn(),
  findManyMock: vi.fn(),
}));

vi.mock("@lite-llm/database/client", () => ({
  db: {
    select: mockDbSelect,
    insert: mockDbInsert,
    update: mockDbUpdate,
  },
}));

function setupDbMock(overrides?: {
  modelRows?: Array<Record<string, unknown>>;
  providerRow?: Record<string, unknown> | null;
}) {
  const modelRows = overrides?.modelRows ?? [
    {
      modelId: "gpt-test",
      enabled: true,
      displayName: null,
      family: "openai",
      providerId: "00000000-0000-0000-0000-000000000001",
      pricing: null,
      updatedAt: new Date("2026-06-16T00:00:00.000Z"),
    },
  ];
  const joinedModelRows = modelRows.map((row) => ({
    row,
    providerIsDefault: true,
  }));
  const providerRow = overrides?.providerRow ?? {
    id: "00000000-0000-0000-0000-000000000001",
    name: "default",
    credentialEnvelope: encryptProviderSecret(
      "sk-test-provider-key",
      parseProviderEncryptionKey(),
    ),
    baseUrl: "https://upstream.example.com/v1",
  };

  mockDbSelect.mockImplementation(() => {
    const chain: Record<string, unknown> = {
      // biome-ignore lint/suspicious/noThenProperty: deliberate thenable chain mock for drizzle select
      then: (resolve: (value: unknown) => void) => resolve(joinedModelRows),
      from: () => chain,
      innerJoin: () => chain,
      leftJoin: () => chain,
      where: () => chain,
      orderBy: () => Promise.resolve(modelRows),
      limit: () => {
        if (providerRow) {
          return Promise.resolve([providerRow]);
        }
        return Promise.resolve([]);
      },
    };
    return chain;
  });

  mockDbInsert.mockImplementation(() => ({
    values: vi.fn((data: Record<string, unknown>) => {
      createMock([{ data }]);
      return {
        returning: vi.fn(() => Promise.resolve([{ id: "req_1", ...data }])),
      };
    }),
  }));

  mockDbUpdate.mockImplementation(() => ({
    set: vi.fn((data: Record<string, unknown>) => {
      updateMock({ data });
      return {
        where: vi.fn(() => Promise.resolve()),
      };
    }),
  }));
}

function createDatabaseMock() {
  const joinedModelRows = [
    {
      row: {
        id: "00000000-0000-0000-0000-000000000001",
        modelId: "gpt-test",
        enabled: true,
        displayName: null,
        family: "openai",
        providerId: "00000000-0000-0000-0000-000000000001",
        pricing: null,
        updatedAt: new Date("2026-06-16T00:00:00.000Z"),
      },
      providerIsDefault: true,
    },
  ];

  const plainModelRows = [
    {
      id: "00000000-0000-0000-0000-000000000001",
      modelId: "gpt-test",
      enabled: true,
      displayName: null,
      family: "openai",
      providerId: "00000000-0000-0000-0000-000000000001",
      pricing: null,
      updatedAt: new Date("2026-06-16T00:00:00.000Z"),
    },
  ];

  const providerRow = {
    id: "00000000-0000-0000-0000-000000000001",
    name: "default",
    credentialEnvelope: encryptProviderSecret(
      "sk-test-provider-key",
      parseProviderEncryptionKey(),
    ),
    baseUrl: "https://upstream.example.com/v1",
  };

  mockDbSelect.mockImplementation(() => {
    const chain: Record<string, unknown> = {
      // biome-ignore lint/suspicious/noThenProperty: deliberate thenable chain mock for drizzle select
      then: (resolve: (value: unknown) => void) => resolve(joinedModelRows),
      from: () => chain,
      innerJoin: () => chain,
      leftJoin: () => chain,
      where: () => chain,
      orderBy: () => Promise.resolve(plainModelRows),
      limit: () => Promise.resolve([providerRow]),
    };
    return chain;
  });

  mockDbInsert.mockImplementation(() => ({
    values: vi.fn((data: Record<string, unknown>) => {
      createMock([{ data }]);
      return {
        returning: vi.fn(() => Promise.resolve([{ id: "req_1", ...data }])),
      };
    }),
  }));

  mockDbUpdate.mockImplementation(() => ({
    set: vi.fn((data: Record<string, unknown>) => {
      updateMock({ data });
      return {
        where: vi.fn(() => Promise.resolve()),
      };
    }),
  }));

  return {
    modelProxyRequest: {
      create: createMock,
      update: updateMock,
    },
    modelProxyModel: {
      findMany: findManyMock,
    },
  };
}

function createProviderServiceMock() {
  return {
    getAll: vi.fn().mockResolvedValue({
      "local-proxy": {
        name: "Local Model Proxy",
        ownedBy: "agent-lens",
        baseUrl: "http://localhost:3008/v1",
        apiKey: "env:MODEL_PROXY_API_KEY",
      },
      openai: {
        name: "OpenAI",
        adapter: "openai-compatible",
        baseUrl: "https://upstream.example.com/v1",
      },
    }),
    get: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    delete: vi.fn(),
  };
}

describe("ModelProxyService", () => {
  beforeEach(() => {
    process.env.APP_ENCRYPTION_KEY = "0123456789abcdef0123456789abcdef";
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("lists models from proxy registry", async () => {
    setupDbMock();
    const service = new ModelProxyService({
      fetchFn: vi.fn() as never,
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

  it("forwards custom payload fields without schema validation", async () => {
    setupDbMock();
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "chatcmpl_custom",
          object: "chat.completion",
          usage: {
            prompt_tokens: 3,
            completion_tokens: 2,
            total_tokens: 5,
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
      fetchFn: fetchFn as never,
      providerService: createProviderServiceMock() as never,
      now: (() => {
        const times = [
          new Date("2026-06-16T00:00:00.000Z"),
          new Date("2026-06-16T00:00:00.100Z"),
        ];
        return () => times.shift() ?? new Date("2026-06-16T00:00:00.100Z");
      })(),
    });

    await service.proxyOpenAiEndpoint("chat/completions", {
      model: "gpt-test",
      messages: [{ role: "user", content: "hello" }],
      tools: [{ type: "function", function: { name: "lookup" } }],
      custom_field: { nested: true },
    });

    const requestInit = vi.mocked(fetchFn).mock.calls[0]?.[1];
    expect(requestInit?.body).toEqual(
      JSON.stringify({
        model: "gpt-test",
        messages: [{ role: "user", content: "hello" }],
        tools: [{ type: "function", function: { name: "lookup" } }],
        custom_field: { nested: true },
      }),
    );
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
      fetchFn: fetchFn as never,
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
    expect(
      vi.mocked(database.modelProxyRequest.create).mock.calls[0]?.[0],
    ).toEqual([
      expect.objectContaining({
        data: expect.objectContaining({
          apiKeyAlias: "test-key",
          endUser: "alice",
        }),
      }),
    ]);
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
  });

  it("records usage and cost for responses API requests", async () => {
    const database = createDatabaseMock();
    const fetchFn = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "resp_1",
          object: "response",
          usage: {
            input_tokens: 12,
            output_tokens: 6,
            total_tokens: 18,
          },
          output: [
            {
              type: "message",
              role: "assistant",
              content: "ok",
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
      fetchFn: fetchFn as never,
      providerService: createProviderServiceMock() as never,
      now: (() => {
        const times = [
          new Date("2026-06-16T00:00:00.000Z"),
          new Date("2026-06-16T00:00:00.100Z"),
        ];
        return () => times.shift() ?? new Date("2026-06-16T00:00:00.100Z");
      })(),
    });

    await service.createResponse(
      {
        model: "gpt-test",
        input: "hello",
        user: "alice",
      },
      undefined,
      { apiKeyAlias: "test-key" },
    );

    expect(fetchFn).toHaveBeenCalledWith(
      "https://upstream.example.com/v1/responses",
      expect.objectContaining({
        method: "POST",
      }),
    );
    const updateCall = vi.mocked(database.modelProxyRequest.update).mock
      .calls[0];
    expect(updateCall?.[0]).toEqual(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "success",
          inputTokens: 12,
          outputTokens: 6,
          totalTokens: 18,
          upstreamRequestId: "resp_1",
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
      fetchFn: fetchFn as never,
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
      fetchFn: fetchFn as never,
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
      fetchFn: fetchFn as never,
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
      fetchFn: fetchFn as never,
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
      fetchFn: fetchFn as never,
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
      .calls[0]?.[0]?.[0];
    expect(createCall?.data?.requestBody).toEqual(
      expect.objectContaining({
        messages: [{ role: "user", content: "token [REDACTED] here" }],
      }),
    );
  });

  it("keeps cost snapshot immutable when model pricing changes later", async () => {
    setupDbMock({
      modelRows: [
        {
          modelId: "gpt-test",
          enabled: true,
          displayName: null,
          family: "openai",
          providerId: "00000000-0000-0000-0000-000000000001",
          pricing: { input: 0.000001, output: 0.000002 },
          updatedAt: new Date("2026-06-16T00:00:00.000Z"),
        },
      ],
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
      fetchFn: fetchFn as never,
      providerService: createProviderServiceMock() as never,
      now: () => new Date("2026-06-16T00:00:00.000Z"),
    });

    await service.createChatCompletion({
      model: "gpt-test",
      stream: false,
      messages: [{ role: "user", content: "hello" }],
    });

    const updateCall = updateMock.mock.calls[0];
    expect(updateCall?.[0]?.data).toEqual(
      expect.objectContaining({
        inputCostPerToken: 0.000001,
        outputCostPerToken: 0.000002,
        totalCost: expect.closeTo(0.00002, 8),
      }),
    );
  });

  it("notifies listeners when a request finishes", async () => {
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
      fetchFn: fetchFn as never,
      providerService: createProviderServiceMock() as never,
      now: () => new Date("2026-06-16T00:00:00.000Z"),
    });

    service.onRequestFinished(listener);

    await service.createChatCompletion({
      model: "gpt-test",
      stream: false,
      messages: [{ role: "user", content: "hello" }],
    });

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0]?.[0]).toMatch(/^[0-9a-f-]{36}$/);
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
      fetchFn: fetchFn as never,
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
