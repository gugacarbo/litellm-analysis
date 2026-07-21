import { z } from "zod";

const pageSchema = z.coerce.number().int().min(1).default(1);
const pageSizeSchema = z.coerce.number().int().min(1).max(100).default(25);

export const benchmarkCatalogSchema = z.enum([
  "artificial-analysis",
  "openrouter",
]);
export const openRouterSubsourceSchema = z.enum([
  "artificial-analysis",
  "design-arena",
]);

export const benchmarkListInputSchema = z.object({
  page: pageSchema,
  pageSize: pageSizeSchema,
  search: z.string().trim().max(160).optional().default(""),
  provider: z.string().trim().max(120).optional().default(""),
  minIntelligence: z.coerce.number().nonnegative().optional(),
  maxPrice: z.coerce.number().nonnegative().optional(),
  sort: z
    .enum(["intelligence", "price", "name", "elo", "winRate", "time"])
    .default("intelligence"),
  sortDirection: z.enum(["asc", "desc"]).default("desc"),
  subsource: openRouterSubsourceSchema.optional(),
  arena: z.string().trim().max(80).optional().default(""),
  category: z.string().trim().max(120).optional().default(""),
});

export const syncBenchmarkInputSchema = z.object({
  catalog: benchmarkCatalogSchema,
});

export type BenchmarkListInput = z.infer<typeof benchmarkListInputSchema>;
export type SyncBenchmarkInput = z.infer<typeof syncBenchmarkInputSchema>;

export type BenchmarkPublicErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "SNAPSHOT_NOT_FOUND"
  | "CREDENTIAL_NOT_CONFIGURED"
  | "UPSTREAM_UNAVAILABLE"
  | "UPSTREAM_RATE_LIMIT";

export type BenchmarkResult<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      error: {
        code: BenchmarkPublicErrorCode;
        message: string;
        retryable: boolean;
      };
    };
