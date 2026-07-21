import {
  doublePrecision,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const modelProxyBenchmarks = pgTable(
  "model_proxy_benchmarks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    aaModelId: text("aa_model_id").notNull(),
    source: text("source").notNull(),
    name: text("name").notNull(),
    slug: text("slug"),
    creatorId: text("creator_id"),
    creatorName: text("creator_name").notNull(),
    creatorSlug: text("creator_slug"),
    intelligenceIndex: doublePrecision("intelligence_index"),
    codingIndex: doublePrecision("coding_index"),
    mathIndex: doublePrecision("math_index"),
    mmluPro: doublePrecision("mmlu_pro"),
    gpqa: doublePrecision("gpqa"),
    hle: doublePrecision("hle"),
    livecodebench: doublePrecision("livecodebench"),
    scicode: doublePrecision("scicode"),
    math500: doublePrecision("math_500"),
    aime: doublePrecision("aime"),
    aime25: doublePrecision("aime_25"),
    tau2: doublePrecision("tau2"),
    ifbench: doublePrecision("ifbench"),
    lcr: doublePrecision("lcr"),
    terminalbenchHard: doublePrecision("terminalbench_hard"),
    priceInput1mTokens: doublePrecision("price_input_1m_tokens"),
    priceOutput1mTokens: doublePrecision("price_output_1m_tokens"),
    priceBlended1mTokens: doublePrecision("price_blended_1m_tokens"),
    medianOutputTokensPerSecond: doublePrecision(
      "median_output_tokens_per_second",
    ),
    medianTtftSeconds: doublePrecision("median_ttft_seconds"),
    medianTtftAnswerSeconds: doublePrecision("median_ttft_answer_seconds"),
    sourceUrl: text("source_url").notNull(),
    fetchedAt: timestamp("fetched_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("uq_model_proxy_benchmarks_aa_model_id_source").on(
      table.aaModelId,
      table.source,
    ),
  ],
);

export type ModelProxyBenchmark = typeof modelProxyBenchmarks.$inferSelect;
export type NewModelProxyBenchmark = typeof modelProxyBenchmarks.$inferInsert;

/** Current, source-native benchmark snapshots. Legacy normalized rows stay above. */
export const benchmarkSnapshots = pgTable(
  "benchmark_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    catalog: text("catalog").notNull(),
    sourceLabel: text("source_label").notNull(),
    sourceUrl: text("source_url").notNull(),
    citation: text("citation"),
    fetchedAt: timestamp("fetched_at").notNull(),
    count: integer("count").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("uq_benchmark_snapshots_catalog").on(table.catalog)],
);

export const benchmarkSnapshotEntries = pgTable(
  "benchmark_snapshot_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    snapshotId: uuid("snapshot_id")
      .notNull()
      .references(() => benchmarkSnapshots.id, { onDelete: "cascade" }),
    externalId: text("external_id").notNull(),
    subsource: text("subsource"),
    name: text("name").notNull(),
    provider: text("provider"),
    modelPermaslug: text("model_permaslug"),
    arena: text("arena"),
    category: text("category"),
    intelligenceIndex: doublePrecision("intelligence_index"),
    elo: doublePrecision("elo"),
    winRate: doublePrecision("win_rate"),
    averageTimeSeconds: doublePrecision("average_time_seconds"),
    priceInput1mTokens: doublePrecision("price_input_1m_tokens"),
    priceOutput1mTokens: doublePrecision("price_output_1m_tokens"),
    attributionLabel: text("attribution_label").notNull(),
    attributionUrl: text("attribution_url").notNull(),
    attributionCitation: text("attribution_citation"),
    native: jsonb("native").notNull(),
  },
  (table) => [
    uniqueIndex("uq_benchmark_snapshot_entries_snapshot_external").on(
      table.snapshotId,
      table.externalId,
    ),
    index("idx_benchmark_snapshot_entries_subsource").on(table.subsource),
    index("idx_benchmark_snapshot_entries_provider").on(table.provider),
  ],
);

export type BenchmarkSnapshot = typeof benchmarkSnapshots.$inferSelect;
export type NewBenchmarkSnapshot = typeof benchmarkSnapshots.$inferInsert;
export type BenchmarkSnapshotEntry =
  typeof benchmarkSnapshotEntries.$inferSelect;
export type NewBenchmarkSnapshotEntry =
  typeof benchmarkSnapshotEntries.$inferInsert;
