import type {
  ArtificialAnalysisBenchmarkItem,
  BenchmarkCatalog,
  BenchmarkNativeValue,
  BenchmarkSnapshotMetadata,
  NormalizedModelBenchmark,
  OpenRouterBenchmarkItem,
} from "@lite-llm/contracts/benchmarks";
import type { DatabaseClient } from "@lite-llm/database/client";
import { getDb } from "@lite-llm/database/client";
import {
  type BenchmarkSnapshotEntry,
  benchmarkSnapshotEntries,
  benchmarkSnapshots,
  type ModelProxyBenchmark,
  modelProxyBenchmarks,
  type NewModelProxyBenchmark,
} from "@lite-llm/database/schema/model-proxy";
import { and, eq } from "drizzle-orm";
import type {
  IBenchmarksRepository,
  StoredBenchmarkSnapshot,
} from "./interfaces";

function toRow(model: NormalizedModelBenchmark): NewModelProxyBenchmark {
  return {
    aaModelId: model.id,
    source: model.source,
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
    sourceUrl:
      model.source === "artificial-analysis"
        ? "https://artificialanalysis.ai/"
        : "https://openrouter.ai/",
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
    source: row.source as "artificial-analysis" | "openrouter",
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
  constructor(private readonly db: DatabaseClient = getDb()) {}

  async upsert(models: NormalizedModelBenchmark[]): Promise<void> {
    if (models.length === 0) return;

    await this.db.transaction(async (tx) => {
      for (const model of models) {
        await tx
          .insert(modelProxyBenchmarks)
          .values(toRow(model))
          .onConflictDoUpdate({
            target: [
              modelProxyBenchmarks.aaModelId,
              modelProxyBenchmarks.source,
            ],
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
    source?: "artificial-analysis" | "openrouter",
  ): Promise<NormalizedModelBenchmark | null> {
    const conditions = [eq(modelProxyBenchmarks.aaModelId, aaModelId)];
    if (source) {
      conditions.push(eq(modelProxyBenchmarks.source, source));
    }
    const rows = await this.db
      .select()
      .from(modelProxyBenchmarks)
      .where(and(...conditions))
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

  /**
   * The upstream response is fully validated before this is called. Deleting
   * entries and inserting the replacement happens in one transaction, so a
   * failed collection or persistence operation never clears a prior snapshot.
   */
  async replaceSnapshot(snapshot: StoredBenchmarkSnapshot): Promise<void> {
    await this.db.transaction(async (tx) => {
      const [stored] = await tx
        .insert(benchmarkSnapshots)
        .values({
          catalog: snapshot.metadata.catalog,
          sourceLabel: snapshot.metadata.attribution.label,
          sourceUrl: snapshot.metadata.attribution.url,
          citation: snapshot.metadata.attribution.citation,
          fetchedAt: new Date(snapshot.metadata.fetchedAt),
          count: snapshot.items.length,
        })
        .onConflictDoUpdate({
          target: benchmarkSnapshots.catalog,
          set: {
            sourceLabel: snapshot.metadata.attribution.label,
            sourceUrl: snapshot.metadata.attribution.url,
            citation: snapshot.metadata.attribution.citation,
            fetchedAt: new Date(snapshot.metadata.fetchedAt),
            count: snapshot.items.length,
          },
        })
        .returning({ id: benchmarkSnapshots.id });

      if (!stored) throw new Error("Could not store benchmark snapshot");
      await tx
        .delete(benchmarkSnapshotEntries)
        .where(eq(benchmarkSnapshotEntries.snapshotId, stored.id));

      if (snapshot.metadata.catalog === "artificial-analysis") {
        await tx.insert(benchmarkSnapshotEntries).values(
          (snapshot.items as ArtificialAnalysisBenchmarkItem[]).map((item) => ({
            snapshotId: stored.id,
            externalId: item.id,
            name: item.name,
            provider: item.creatorName,
            modelPermaslug: item.slug,
            intelligenceIndex: item.intelligenceIndex,
            priceInput1mTokens: item.priceInput1mTokens,
            priceOutput1mTokens: item.priceOutput1mTokens,
            attributionLabel: snapshot.metadata.attribution.label,
            attributionUrl: snapshot.metadata.attribution.url,
            attributionCitation: snapshot.metadata.attribution.citation,
            native: item,
          })),
        );
      } else {
        await tx.insert(benchmarkSnapshotEntries).values(
          (snapshot.items as OpenRouterBenchmarkItem[]).map((item) => ({
            snapshotId: stored.id,
            externalId: item.id,
            subsource: item.subsource,
            name: item.name,
            provider: item.provider,
            modelPermaslug: item.modelPermaslug,
            arena: item.arena,
            category: item.category,
            intelligenceIndex: item.intelligenceIndex,
            elo: item.elo,
            winRate: item.winRate,
            averageTimeSeconds: item.averageTimeSeconds,
            priceInput1mTokens: item.priceInput1mTokens,
            priceOutput1mTokens: item.priceOutput1mTokens,
            attributionLabel: item.attribution.label,
            attributionUrl: item.attribution.url,
            attributionCitation: item.attribution.citation,
            native: item.native,
          })),
        );
      }
    });
  }

  async getSnapshot(
    catalog: BenchmarkCatalog,
  ): Promise<StoredBenchmarkSnapshot | null> {
    const [snapshot] = await this.db
      .select()
      .from(benchmarkSnapshots)
      .where(eq(benchmarkSnapshots.catalog, catalog))
      .limit(1);
    if (!snapshot) return null;
    const entries = await this.db
      .select()
      .from(benchmarkSnapshotEntries)
      .where(eq(benchmarkSnapshotEntries.snapshotId, snapshot.id));
    const metadata = toMetadata(snapshot);
    return {
      metadata,
      items:
        catalog === "artificial-analysis"
          ? entries.map(toArtificialAnalysisItem)
          : entries.map(toOpenRouterItem),
    };
  }
}

function toMetadata(snapshot: {
  catalog: string;
  sourceLabel: string;
  sourceUrl: string;
  citation: string | null;
  fetchedAt: Date;
  count: number;
}): BenchmarkSnapshotMetadata {
  return {
    catalog: snapshot.catalog as BenchmarkCatalog,
    fetchedAt: snapshot.fetchedAt.toISOString(),
    count: snapshot.count,
    attribution: {
      label: snapshot.sourceLabel,
      url: snapshot.sourceUrl,
      citation: snapshot.citation,
    },
  };
}

function toArtificialAnalysisItem(
  entry: BenchmarkSnapshotEntry,
): ArtificialAnalysisBenchmarkItem {
  return entry.native as ArtificialAnalysisBenchmarkItem;
}

function toOpenRouterItem(
  entry: BenchmarkSnapshotEntry,
): OpenRouterBenchmarkItem {
  return {
    ...(entry.native as Record<string, BenchmarkNativeValue>),
    id: entry.externalId,
    subsource: entry.subsource as OpenRouterBenchmarkItem["subsource"],
    name: entry.name,
    provider: entry.provider,
    modelPermaslug: entry.modelPermaslug,
    arena: entry.arena,
    category: entry.category,
    elo: entry.elo,
    winRate: entry.winRate,
    averageTimeSeconds: entry.averageTimeSeconds,
    intelligenceIndex: entry.intelligenceIndex,
    priceInput1mTokens: entry.priceInput1mTokens,
    priceOutput1mTokens: entry.priceOutput1mTokens,
    attribution: {
      label: entry.attributionLabel,
      url: entry.attributionUrl,
      citation: entry.attributionCitation,
    },
    native: entry.native as Record<string, BenchmarkNativeValue>,
  };
}

export function createBenchmarksRepository(): IBenchmarksRepository {
  return new DbBenchmarksRepository();
}

export function createBenchmarksRepositoryWithDb(
  db: DatabaseClient,
): IBenchmarksRepository {
  return new DbBenchmarksRepository(db);
}
