import { createTestDb } from "@lite-llm/database/test-helpers";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createBenchmarksRepository } from "./db-repository";
import type { NormalizedModelBenchmark } from "@lite-llm/contracts/benchmarks";

function makeModel(overrides: Partial<NormalizedModelBenchmark> = {}): NormalizedModelBenchmark {
  return {
    id: "test-model-1",
    name: "Test Model 1",
    slug: "test-model-1",
    creatorId: "creator-1",
    creatorName: "Test Creator",
    creatorSlug: "test-creator",
    intelligenceIndex: 85.5,
    codingIndex: 90.0,
    mathIndex: 80.0,
    mmluPro: 88.0,
    gpqa: 75.0,
    hle: 70.0,
    livecodebench: 82.0,
    scicode: 78.0,
    math500: 92.0,
    aime: 65.0,
    aime25: null,
    tau2: null,
    ifbench: null,
    lcr: null,
    terminalbenchHard: null,
    priceInput1mTokens: 2.5,
    priceOutput1mTokens: 10.0,
    priceBlended1mTokens: 4.375,
    medianOutputTokensPerSecond: 80.0,
    medianTimeToFirstTokenSeconds: 0.5,
    medianTimeToFirstAnswerTokenSeconds: 0.8,
    ...overrides,
  };
}

describe("DbBenchmarksRepository", () => {
  let testDb: Awaited<ReturnType<typeof createTestDb>>;

  beforeEach(async () => {
    testDb = await createTestDb();
  });

  afterEach(async () => {
    await testDb.stop();
  });

  it("upserts and retrieves models", async () => {
    const repo = createBenchmarksRepository();
    const model = makeModel();

    await repo.upsert([model]);
    const all = await repo.getAll();

    expect(all).toHaveLength(1);
    expect(all[0].id).toBe("test-model-1");
    expect(all[0].name).toBe("Test Model 1");
    expect(all[0].intelligenceIndex).toBe(85.5);
    expect(all[0].priceInput1mTokens).toBe(2.5);
  });

  it("upsert updates existing models by aaModelId", async () => {
    const repo = createBenchmarksRepository();
    const model = makeModel();

    await repo.upsert([model]);

    const updated = makeModel({ name: "Updated Model", intelligenceIndex: 95.0 });
    await repo.upsert([updated]);

    const all = await repo.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe("Updated Model");
    expect(all[0].intelligenceIndex).toBe(95.0);
  });

  it("getByAaModelId returns matching model", async () => {
    const repo = createBenchmarksRepository();
    const model1 = makeModel();
    const model2 = makeModel({ id: "test-model-2", name: "Test Model 2" });

    await repo.upsert([model1, model2]);

    const found = await repo.getByAaModelId("test-model-2");
    expect(found).not.toBeNull();
    expect(found!.name).toBe("Test Model 2");

    const notFound = await repo.getByAaModelId("nonexistent");
    expect(notFound).toBeNull();
  });

  it("count returns correct number of models", async () => {
    const repo = createBenchmarksRepository();

    expect(await repo.count()).toBe(0);

    await repo.upsert([makeModel(), makeModel({ id: "test-model-2", name: "M2" })]);
    expect(await repo.count()).toBe(2);
  });

  it("clear removes all models", async () => {
    const repo = createBenchmarksRepository();

    await repo.upsert([makeModel(), makeModel({ id: "test-model-2", name: "M2" })]);
    expect(await repo.count()).toBe(2);

    await repo.clear();
    expect(await repo.count()).toBe(0);
  });

  it("upsert with empty array is a no-op", async () => {
    const repo = createBenchmarksRepository();

    await repo.upsert([]);
    expect(await repo.count()).toBe(0);
  });

  it("handles null benchmark values", async () => {
    const repo = createBenchmarksRepository();
    const model = makeModel({
      id: "null-model",
      name: "Null Model",
      intelligenceIndex: null,
      codingIndex: null,
      aime25: null,
    });

    await repo.upsert([model]);
    const all = await repo.getAll();

    expect(all[0].intelligenceIndex).toBeNull();
    expect(all[0].codingIndex).toBeNull();
    expect(all[0].aime25).toBeNull();
  });
});
