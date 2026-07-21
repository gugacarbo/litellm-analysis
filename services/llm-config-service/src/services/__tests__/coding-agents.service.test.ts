import { describe, expect, it } from "vitest";
import type {
  CodingAgentModelRow,
  CodingAgentProviderRow,
  CodingAgentsRepository,
} from "../../types/coding-agents.js";
import { CodingAgentsService } from "../coding-agents.service.js";

const now = new Date("2026-07-20T12:00:00.000Z");
const alphaId = "00000000-0000-4000-8000-000000000001";
const betaId = "00000000-0000-4000-8000-000000000002";

function provider(
  id: string,
  name: string,
  overrides: Partial<CodingAgentProviderRow> = {},
): CodingAgentProviderRow {
  return {
    id,
    name,
    provider: "openai-compatible",
    baseUrl: `https://${name.toLowerCase()}.example/v1`,
    isDefault: id === alphaId,
    revision: 1,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

function model(
  id: string,
  providerId: string,
  modelId: string,
): CodingAgentModelRow {
  return {
    id,
    providerId,
    modelId,
    revision: 1,
    enabled: true,
    displayName: null,
    family: null,
    description: null,
    contextLength: null,
    maxCompletionTokens: null,
    knowledgeCutoff: null,
    expirationDate: null,
    architecture: null,
    reasoning: null,
    supportedParameters: null,
    defaultParameters: null,
    perRequestLimits: null,
    pricing: null,
    requestOptions: null,
    reasoningApiId: null,
    createdAt: now,
    updatedAt: now,
  };
}

class Repository implements CodingAgentsRepository {
  async listProviders() {
    return [provider(alphaId, "Alpha"), provider(betaId, "Beta")];
  }
  async listEnabledModels() {
    return [
      model("10000000-0000-4000-8000-000000000001", alphaId, "shared"),
      model("10000000-0000-4000-8000-000000000002", betaId, "shared"),
    ];
  }
}

describe("CodingAgentsService", () => {
  it("exports one llm-toolbox provider for every enabled model", async () => {
    const artifact = await new CodingAgentsService({
      repository: new Repository(),
      publicBaseUrl: "https://proxy.example/v1",
    }).generateArtifact("hebo");
    const config = JSON.parse(artifact.content);
    expect(Object.keys(config.provider)).toEqual(["llm-toolbox"]);
    expect(config.provider["llm-toolbox"].name).toBe("llm-toolbox");
    expect(config.provider["llm-toolbox"].options.apiKey).toBe(
      "{env:MODEL_PROXY_API_KEY}",
    );
    expect(Object.keys(config.provider["llm-toolbox"].models)).toEqual([
      "Alpha/shared",
      "Beta/shared",
      "shared",
    ]);
  });

  it("exports all configured providers directly with environment references", async () => {
    const artifact = await new CodingAgentsService({
      repository: new Repository(),
    }).generateArtifact("providers");
    const config = JSON.parse(artifact.content);
    expect(Object.keys(config.provider)).toEqual(["alpha", "beta"]);
    expect(config.provider.alpha.options.apiKey).toBe("{env:ALPHA_API_KEY}");
    expect(config.provider.beta.options.apiKey).toBe("{env:BETA_API_KEY}");
    expect(artifact.warnings[0]).toContain("bypasses Hebo");
  });
});
