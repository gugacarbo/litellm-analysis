import type { NormalizedModelBenchmark } from "@lite-llm/contracts/benchmarks";
import { getDb } from "@lite-llm/database/client";
import {
  modelProxyBenchmarks,
  type ModelProxyBenchmark,
  type NewModelProxyBenchmark,
} from "@lite-llm/database/schema/model-proxy";
import { eq } from "drizzle-orm";
import type { IBenchmarksRepository } from "./interfaces";

function toRow(model: NormalizedModelBenchmark): NewModelProxyBenchmark {
  return {
    aaModelId: model.id,
    name: model.name,
    slug: model.slug,
    creatorId: model.creatorId,
    creatorName: model.creatorName,
    creatorSlug: model.creatorSlug,
    intelligenceIndex: model.intelligenceIndex,
    codingIndex: model.codingIndex,
    mathIndex: model.mathIndex,
    mmluPro: model.mmluPro,
    gpqa: model.gpqa,
    hle: model.hle,
    livecodebench: model.livecodebench,
    scicode: model.scicode,
    math500: model.math500,
    aime: model.aime,
    aime25: model.aime25,
    tau2: model.tau2,
    ifbench: model.ifbench,
    lcr: model.lcr,
    terminalbenchHard: model.terminalbenchHard,
    priceInput1mTokens: model.priceInput1mTokens,
    priceOutput1mTokens: model.priceOutput1mTokens,
    priceBlended1mTokens: model.priceBlended1mTokens,
    medianOutputTokensPerSecond: model.medianOutputTokensPerSecond,
    medianTtftSeconds: model.medianTimeToFirstTokenSeconds,
    medianTtftAnswerSeconds: model.medianTimeToFirstAnswerTokenSeconds,
    sourceUrl: "https://artificialanalysis.ai/",
  };
}

function fromRow(row: ModelProxyBenchmark): NormalizedModelBenchmark {
  return {
    id: row.aaModelId,
    name: row.name,
    slug: row.slug,
    creatorId: row.creatorId,
    creatorName: row.creatorName,
    creatorSlug: row.creatorSlug,
    intelligenceIndex: row.intelligenceIndex,
    codingIndex: row.codingIndex,
    mathIndex: row.mathIndex,
    mmluPro: row.mmluPro,
    gpqa: row.gpqa,
    hle: row.hle,
    livecodebench: row.livecodebench,
    scicode: row.scicode,
    math500: row.math500,
    aime: row.aime,
    aime25: row.aime25,
    tau2: row.tau2,
    ifbench: row.ifbench,
    lcr: row.lcr,
    terminalbenchHard: row.terminalbenchHard,
    priceInput1mTokens: row.priceInput1mTokens,
    priceOutput1mTokens: row.priceOutput1mTokens,
    priceBlended1mTokens: row.priceBlended1mTokens,
    medianOutputTokensPerSecond: row.medianOutputTokensPerSecond,
    medianTimeToFirstTokenSeconds: row.medianTtftSeconds,
    medianTimeToFirstAnswerTokenSeconds: row.medianTtftAnswerSeconds,
  };
}

export class DbBenchmarksRepository implements IBenchmarksRepository {
  private get db() {
    return getDb();
  }

  async upsert(models: NormalizedModelBenchmark[]): Promise<void> {
    if (models.length === 0) return;

    await this.db.transaction(async (tx) => {
      for (const model of models) {
        await tx
          .insert(modelProxyBenchmarks)
          .values(toRow(model))
          .onConflictDoUpdate({
            target: modelProxyBenchmarks.aaModelId,
            set: toRow(model),
          });
      }
    });
  }

  async getAll(): Promise<NormalizedModelBenchmark[]> {
    const rows = await this.db.select().from(modelProxyBenchmarks);
    return rows.map(fromRow);
  }

  async getByAaModelId(
    aaModelId: string,
  ): Promise<NormalizedModelBenchmark | null> {
    const rows = await this.db
      .select()
      .from(modelProxyBenchmarks)
      .where(eq(modelProxyBenchmarks.aaModelId, aaModelId))
      .limit(1);
    return rows.length > 0 ? fromRow(rows[0]) : null;
  }

  async count(): Promise<number> {
    const rows = await this.db.select().from(modelProxyBenchmarks);
    return rows.length;
  }

  async clear(): Promise<void> {
    await this.db.delete(modelProxyBenchmarks);
  }
}

export function createBenchmarksRepository(): IBenchmarksRepository {
  return new DbBenchmarksRepository();
}
