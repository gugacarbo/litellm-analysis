import { createTestDb } from "@lite-llm/database/test-helpers";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createDbRepository } from "./db-repository";

describe("DbAgentsRepository", () => {
  let db: Awaited<ReturnType<typeof createTestDb>>;

  beforeEach(async () => {
    db = await createTestDb();
  });

  afterEach(async () => {
    await db.stop();
  });

  async function createRepository() {
    return createDbRepository({ db: db.db, validateOnRead: false });
  }

  it("round-trips agents and plugins through dashboard settings keys", async () => {
    const repository = await createRepository();

    const config = {
      version: 2,
      categories: {},
      agents: {
        loom: {
          displayName: "Loom",
          icon: "L",
          description: "Agent",
          limits: { context: 200000, output: 32768 },
          model: "gpt-4",
          config: {},
        },
      },
      plugins: {
        opencode: {
          enabled: true,
          outputFile: "opencode.json",
          config: {},
          routing: { agents: {}, categories: {} },
        },
      },
    };

    await repository.write(config);
    const readBack = await repository.read();

    expect(readBack.agents?.loom?.model).toBe("gpt-4");
    expect(readBack.plugins?.opencode?.enabled).toBe(true);
  });

  it("reports exists when both dashboard settings are present", async () => {
    const repository = await createRepository();

    expect(await repository.exists()).toBe(false);

    await repository.write({
      version: 2,
      categories: {},
      agents: {
        test: {
          displayName: "Test",
          icon: "T",
          description: "description",
          limits: { context: 200000, output: 32768 },
          model: "test-model",
          config: {},
        },
      },
      plugins: {},
    });

    expect(await repository.exists()).toBe(true);
  });

  it("reports exists when both keys are present", async () => {
    const repository = await createRepository();

    await repository.write({
      version: 2,
      categories: {},
      agents: {},
      plugins: {},
    });

    expect(await repository.exists()).toBe(true);
  });
});
