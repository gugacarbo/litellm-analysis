import type {
  IBenchmarksRepository,
  StoredBenchmarkSnapshot,
} from "@lite-llm/benchmarks-repository";
import type {
  ArtificialAnalysisBenchmarkItem,
  BenchmarkSnapshotMetadata,
} from "@lite-llm/contracts/benchmarks";
import { describe, expect, it, vi } from "vitest";
import type { BenchmarkHandlerDeps } from "./benchmarks.handlers";
import { handleSyncBenchmarks } from "./benchmarks.handlers";
import {
  type BenchmarkServiceError,
  BenchmarksService,
} from "./benchmarks.service";

vi.mock("@lite-llm/benchmarks-repository", () => ({
  createBenchmarksRepository: vi.fn(),
}));

const metadata: BenchmarkSnapshotMetadata = {
  catalog: "artificial-analysis",
  fetchedAt: "2026-07-21T12:00:00.000Z",
  count: 1,
  attribution: {
    label: "Artificial Analysis",
    url: "https://artificialanalysis.ai/",
    citation: null,
  },
};

const legacyItem: ArtificialAnalysisBenchmarkItem = {
  id: "prior-snapshot",
  name: "Prior snapshot",
  slug: null,
  creatorId: null,
  creatorName: "Provider",
  creatorSlug: null,
  source: "artificial-analysis",
  intelligenceIndex: null,
  codingIndex: null,
  mathIndex: null,
  mmluPro: null,
  gpqa: null,
  hle: null,
  livecodebench: null,
  scicode: null,
  math500: null,
  aime: null,
  aime25: null,
  tau2: null,
  ifbench: null,
  lcr: null,
  terminalbenchHard: null,
  priceInput1mTokens: null,
  priceOutput1mTokens: null,
  priceBlended1mTokens: null,
  medianOutputTokensPerSecond: null,
  medianTimeToFirstTokenSeconds: null,
  medianTimeToFirstAnswerTokenSeconds: null,
};

function repository() {
  let prior: StoredBenchmarkSnapshot = { metadata, items: [legacyItem] };
  const replaceSnapshot = vi.fn(async (snapshot: StoredBenchmarkSnapshot) => {
    prior = snapshot;
  });
  return {
    api: {
      getSnapshot: vi.fn(async () => prior),
      replaceSnapshot,
    } as unknown as IBenchmarksRepository,
    prior: () => prior,
    replaceSnapshot,
  };
}

function service(
  repo: IBenchmarksRepository,
  responseBodies: unknown[],
): BenchmarksService {
  const fetcher = vi.fn(
    async () =>
      new Response(JSON.stringify(responseBodies.shift()), { status: 200 }),
  );
  return new BenchmarksService(
    repo,
    { resolve: vi.fn().mockResolvedValue("encrypted-secret") },
    fetcher,
  );
}

function handlerDeps(service: BenchmarksService): BenchmarkHandlerDeps {
  return {
    getSession: vi.fn().mockResolvedValue({
      ok: true,
      session: { user: { id: "admin", role: "admin" }, session: { id: "s" } },
    }),
    requireAdmin: vi.fn().mockResolvedValue({ ok: true }),
    getService: vi.fn().mockResolvedValue({
      listArtificialAnalysis: service.listArtificialAnalysis.bind(service),
      listOpenRouter: service.listOpenRouter.bind(service),
      sync: service.sync.bind(service),
    }),
  };
}

describe("BenchmarksService upstream validation", () => {
  it("maps invalid Artificial Analysis data to a retryable public error without replacing the prior snapshot", async () => {
    const repo = repository();
    const benchmarks = service(repo.api, [
      { data: [{ rawDiagnostic: "Bearer aa-payload-secret" }] },
      { data: [{ rawDiagnostic: "Bearer aa-payload-secret" }] },
    ]);

    await expect(benchmarks.sync("artificial-analysis")).rejects.toMatchObject({
      code: "UPSTREAM_UNAVAILABLE",
      retryable: true,
    } satisfies Partial<BenchmarkServiceError>);
    expect(repo.replaceSnapshot).not.toHaveBeenCalled();
    expect(repo.prior()).toEqual({ metadata, items: [legacyItem] });

    await expect(
      handleSyncBenchmarks(handlerDeps(benchmarks), "artificial-analysis"),
    ).resolves.toEqual({
      ok: false,
      error: {
        code: "UPSTREAM_UNAVAILABLE",
        message: "Benchmark provider returned invalid data",
        retryable: true,
      },
    });
  });

  it("maps mismatched OpenRouter sources to a retryable public error without replacing the prior snapshot", async () => {
    const repo = repository();
    const mismatchedSource = {
      data: [
        {
          source: "design-arena",
          model_permaslug: "provider/model",
          display_name: "Wrong source",
          rawDiagnostic: "Bearer openrouter-payload-secret",
        },
      ],
      meta: {},
    };
    const validArenaResponse = { data: [], meta: {} };
    const benchmarks = service(repo.api, [
      mismatchedSource,
      validArenaResponse,
      mismatchedSource,
      validArenaResponse,
    ]);

    await expect(benchmarks.sync("openrouter")).rejects.toMatchObject({
      code: "UPSTREAM_UNAVAILABLE",
      retryable: true,
    } satisfies Partial<BenchmarkServiceError>);
    expect(repo.replaceSnapshot).not.toHaveBeenCalled();
    expect(repo.prior()).toEqual({ metadata, items: [legacyItem] });

    await expect(
      handleSyncBenchmarks(handlerDeps(benchmarks), "openrouter"),
    ).resolves.toEqual({
      ok: false,
      error: {
        code: "UPSTREAM_UNAVAILABLE",
        message: "Benchmark provider returned invalid data",
        retryable: true,
      },
    });
  });
});
