import { beforeEach, describe, expect, it, vi } from "vitest";

const { buildHeboGatewayConfigMock, gatewayMock, createLedgerHooksMock } =
  vi.hoisted(() => ({
    buildHeboGatewayConfigMock: vi.fn(),
    gatewayMock: vi.fn(),
    createLedgerHooksMock: vi.fn(() => ({
      before: vi.fn(),
      onError: vi.fn(),
      onRequest: vi.fn(),
      onResponse: vi.fn(),
      resolveProvider: vi.fn(),
    })),
  }));

vi.mock("./build-config", () => ({
  buildHeboGatewayConfig: buildHeboGatewayConfigMock,
}));

vi.mock("@hebo-ai/gateway", () => ({
  gateway: gatewayMock,
}));

vi.mock("./ledger-hooks", () => ({
  HEBO_MAX_BODY_SIZE: 10 * 1024 * 1024,
  createLedgerHooks: createLedgerHooksMock,
}));

vi.mock("../logging/request-ledger", () => ({
  RequestLedger: class {
    onRequestFinished() {
      return () => {};
    }
  },
}));

import { createHeboModelProxyGateway } from "./create-gateway";

describe("createHeboModelProxyGateway", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns a 503 handler when no upstream providers are configured", async () => {
    buildHeboGatewayConfigMock.mockResolvedValue({
      providers: {},
      models: {},
      providerByModel: new Map(),
      targetsByModel: new Map(),
    });

    const heboGateway = await createHeboModelProxyGateway({
      providerService: { getAll: vi.fn() } as never,
      openAiOAuthService: {} as never,
    });

    const response = await heboGateway.handler(
      new Request("http://localhost/v1/models"),
    );

    expect(response.status).toBe(503);
    await expect(response.json()).resolves.toEqual({
      error: {
        message:
          "No upstream providers are configured for the model proxy yet.",
        type: "service_unavailable",
      },
    });
    expect(gatewayMock).not.toHaveBeenCalled();
  });

  it("creates the Hebo gateway when providers are available", async () => {
    const handler = vi.fn(async () =>
      Response.json({ object: "list", data: [] }),
    );
    buildHeboGatewayConfigMock.mockResolvedValue({
      providers: { upstream0: { id: "upstream0" } },
      models: { "gpt-4.1": { providers: ["upstream0"] } },
      providerByModel: new Map([["gpt-4.1", "upstream0"]]),
      targetsByModel: new Map(),
    });
    gatewayMock.mockReturnValue({ handler });

    const heboGateway = await createHeboModelProxyGateway({
      providerService: { getAll: vi.fn() } as never,
      openAiOAuthService: {} as never,
    });

    const response = await heboGateway.handler(
      new Request("http://localhost/v1/models"),
    );

    expect(gatewayMock).toHaveBeenCalledOnce();
    expect(response.status).toBe(200);
  });
});
