import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  createAgentsManager,
  readDb,
  writeDb,
  writeFullConfig,
} from "../index.js";
import type { DbConfig } from "../types/index.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs
      .splice(0)
      .map((dir) => fs.rm(dir, { recursive: true, force: true })),
  );
});

describe("writeFullConfig", () => {
  it("replaces agents/categories and preserves unrelated db sections", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "agents-manager-"));
    tempDirs.push(tempDir);
    const dbFile = path.join(tempDir, "db.json");

    createAgentsManager({ dbFile });

    const initialDb: DbConfig = {
      version: 2,
      litellm: {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "secret",
      },
      models: {
        "gpt-4o": {
          displayName: "GPT-4o",
          contextLength: 128000,
          maxOutput: 4096,
        },
      },
      agents: {
        coder: {
          model: "old-coder-model",
          description: "old description",
          color: "blue",
        },
        reviewer: {
          model: "old-reviewer-model",
        },
      },
      categories: {
        coding: {
          model: "old-category-model",
          description: "old category description",
          tools: { web: true },
        },
        support: {
          model: "support-model",
        },
      },
      customAliases: {
        latest: "gpt-4o",
      },
    };

    await writeDb(initialDb);

    await writeFullConfig({
      agents: {
        coder: {
          model: "new-coder-model",
        },
      },
      categories: {
        coding: {
          model: "new-category-model",
        },
      },
    });

    const updatedDb = await readDb();

    expect(updatedDb.version).toBe(initialDb.version);
    expect(updatedDb.litellm).toEqual(initialDb.litellm);
    expect(updatedDb.models).toEqual(initialDb.models);
    expect(updatedDb.customAliases).toEqual(initialDb.customAliases);

    expect(updatedDb.agents).toEqual({
      coder: {
        model: "new-coder-model",
      },
    });

    expect(updatedDb.categories).toEqual({
      coding: {
        model: "new-category-model",
      },
    });
  });
});
