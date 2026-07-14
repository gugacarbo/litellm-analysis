import { describe, expect, it, vi } from "vitest";

const { createOpenAICompatibleMock, doGenerateMock } = vi.hoisted(() => ({
  createOpenAICompatibleMock: vi.fn(),
  doGenerateMock: vi.fn().mockResolvedValue({ text: "ok" }),
}));

vi.mock("@ai-sdk/openai-compatible", () => ({
  createOpenAICompatible: createOpenAICompatibleMock,
}));

import { createCredentialScopedProvider } from "./ledger-hooks";

describe("createCredentialScopedProvider", () => {
  it("keeps plaintext out of returned provider/model objects and uses it only while sending", async () => {
    createOpenAICompatibleMock.mockReturnValue({
      languageModel: () => ({ doGenerate: doGenerateMock }),
    });
    const modelAdminService = {
      useProviderCredential: vi.fn(async (_providerId, operation) =>
        operation("plain-text-secret"),
      ),
    };

    const provider = createCredentialScopedProvider({
      target: {
        model: "openai/gpt-test",
        providerId: "provider-a",
        upstreamModel: "gpt-test",
        upstreamBaseUrl: "https://api.example.test/v1",
        ownedBy: "openai",
        cost: {},
      },
      modelAdminService: modelAdminService as never,
    });
    const model = provider.languageModel("gpt-test");

    expect(JSON.stringify(provider)).not.toContain("plain-text-secret");
    expect(JSON.stringify(model)).not.toContain("plain-text-secret");
    expect(Object.values(provider)).not.toContain("plain-text-secret");
    expect(Object.values(model)).not.toContain("plain-text-secret");

    await model.doGenerate({} as never);

    expect(createOpenAICompatibleMock).toHaveBeenCalledWith(
      expect.objectContaining({ apiKey: "plain-text-secret" }),
    );
    expect(doGenerateMock).toHaveBeenCalledOnce();
    expect(JSON.stringify(provider)).not.toContain("plain-text-secret");
    expect(JSON.stringify(model)).not.toContain("plain-text-secret");
  });
});
