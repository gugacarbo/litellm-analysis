import { afterEach, describe, expect, it, vi } from "vitest";

const writeFileMock = vi.hoisted(() => vi.fn());
const readFileMock = vi.hoisted(() => vi.fn());

const mkdirMock = vi.hoisted(() => vi.fn());
const renameMock = vi.hoisted(() => vi.fn());

vi.mock("node:fs", async () => {
  const actual = await vi.importActual<typeof import("node:fs")>("node:fs");
  return {
    ...actual,
    promises: {
      ...actual.promises,
      writeFile: writeFileMock,
      readFile: readFileMock,
      mkdir: mkdirMock,
      rename: renameMock,
    },
  };
});

import { writeVscodeModelsFile } from "../config-file";

describe("writeVscodeModelsFile", () => {
  afterEach(() => {
    writeFileMock.mockReset();
    readFileMock.mockReset();
    mkdirMock.mockReset();
    renameMock.mockReset();
  });

  it("writes only the real LiteLLM models it receives", async () => {
    // Mock db.json read to return empty models
    readFileMock.mockImplementation(async (filePath: string) => {
      if (filePath.includes("db.json")) {
        return JSON.stringify({
          version: 1,
          litellm: {
            baseUrl: "http://localhost:4000/v1",
            apiKey: "sk-123456789",
          },
          models: {},
          agents: {},
          categories: {},
        });
      }
      const actual = await vi.importActual<typeof import("node:fs")>("node:fs");
      return actual.promises.readFile(filePath);
    });

    await writeVscodeModelsFile([
      {
        modelName: "openai/gpt-4.1",
        litellmParams: {
          model_name: "openai/gpt-4.1",
          context_window_size: 128000,
          max_tokens: 4096,
        },
      },
      {
        modelName: "anthropic/claude-3-7-sonnet",
        litellmParams: null,
      },
    ]);

    expect(writeFileMock).toHaveBeenCalledTimes(2);

    const vscodeWrite = writeFileMock.mock.calls.find(([, content]) =>
      String(content).includes('"oaicopilot.models"'),
    );
    expect(vscodeWrite).toBeDefined();

    const [, vscodeContent] = vscodeWrite as [string, string, string];
    const parsed = JSON.parse(vscodeContent) as {
      "oaicopilot.models": Array<{ id: string; displayName: string }>;
    };

    expect(parsed["oaicopilot.models"]).toHaveLength(2);
    expect(parsed["oaicopilot.models"].map((model) => model.id)).toEqual([
      "openai/gpt-4.1",
      "anthropic/claude-3-7-sonnet",
    ]);
    expect(
      parsed["oaicopilot.models"].some((model) => model.id.includes("/gpt-5.")),
    ).toBe(false);

    const dbWrite = writeFileMock.mock.calls.find(([filePath]) =>
      String(filePath).includes("db.json.tmp"),
    );
    expect(dbWrite).toBeDefined();
  });
});
