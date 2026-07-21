import {
  createBenchmarksRepository,
  type IBenchmarksRepository,
} from "@lite-llm/benchmarks-repository";
import type {
  ArtificialAnalysisBenchmarkItem,
  BenchmarkCatalog,
  BenchmarkPage,
  OpenRouterBenchmarkItem,
} from "@lite-llm/contracts/benchmarks";
import type { IApplicationSecretsService } from "@lite-llm/llm-config-service";
import type { BenchmarkListInput } from "../contracts/benchmarks";
import { BenchmarkServiceError } from "./benchmark-errors";
import {
  normalizeArtificialAnalysis,
  normalizeOpenRouter,
} from "./normalizers";

const AA_URL = "https://artificialanalysis.ai/api/v2/data/llms/models";
const OPENROUTER_URL = "https://openrouter.ai/api/v1/benchmarks";

export { BenchmarkServiceError } from "./benchmark-errors";

type Fetcher = (url: string, init: RequestInit) => Promise<Response>;

export class BenchmarksService {
  constructor(
    private readonly repository: IBenchmarksRepository = createBenchmarksRepository(),
    private readonly secrets: Pick<IApplicationSecretsService, "resolve">,
    private readonly fetcher: Fetcher = fetch,
  ) {}

  async listArtificialAnalysis(
    input: BenchmarkListInput,
  ): Promise<BenchmarkPage<ArtificialAnalysisBenchmarkItem>> {
    const snapshot = await this.repository.getSnapshot("artificial-analysis");
    if (!snapshot)
      throw new BenchmarkServiceError(
        "SNAPSHOT_NOT_FOUND",
        "Artificial Analysis snapshot is not available yet",
        false,
      );
    const items = (snapshot.items as ArtificialAnalysisBenchmarkItem[]).filter(
      (item) => {
        const search = input.search.toLowerCase();
        return (
          (!search ||
            `${item.name} ${item.creatorName}`
              .toLowerCase()
              .includes(search)) &&
          (!input.provider ||
            item.creatorName
              .toLowerCase()
              .includes(input.provider.toLowerCase())) &&
          (input.minIntelligence === undefined ||
            (item.intelligenceIndex ?? -Infinity) >= input.minIntelligence) &&
          (input.maxPrice === undefined ||
            (item.priceInput1mTokens ?? Infinity) <= input.maxPrice)
        );
      },
    );
    return paginate(snapshot.metadata, sortAa(items, input), input);
  }

  async listOpenRouter(
    input: BenchmarkListInput,
  ): Promise<BenchmarkPage<OpenRouterBenchmarkItem>> {
    const snapshot = await this.repository.getSnapshot("openrouter");
    if (!snapshot)
      throw new BenchmarkServiceError(
        "SNAPSHOT_NOT_FOUND",
        "OpenRouter snapshot is not available yet",
        false,
      );
    const items = (snapshot.items as OpenRouterBenchmarkItem[]).filter(
      (item) => {
        const search = input.search.toLowerCase();
        return (
          (!search ||
            `${item.name} ${item.provider ?? ""}`
              .toLowerCase()
              .includes(search)) &&
          (!input.provider ||
            (item.provider ?? "")
              .toLowerCase()
              .includes(input.provider.toLowerCase())) &&
          (!input.subsource || item.subsource === input.subsource) &&
          (!input.arena ||
            (item.arena ?? "")
              .toLowerCase()
              .includes(input.arena.toLowerCase())) &&
          (!input.category ||
            (item.category ?? "")
              .toLowerCase()
              .includes(input.category.toLowerCase()))
        );
      },
    );
    // Keep source scales independent even before pagination: Design Arena ELO
    // and Artificial Analysis indices are never compared by the same sorter.
    const aa = sortOpenRouter(
      items.filter((item) => item.subsource === "artificial-analysis"),
      input,
    );
    const arena = sortOpenRouter(
      items.filter((item) => item.subsource === "design-arena"),
      input,
    );
    return paginate(snapshot.metadata, [...aa, ...arena], input);
  }

  async sync(
    catalog: BenchmarkCatalog,
  ): Promise<{ count: number; fetchedAt: string }> {
    if (catalog === "artificial-analysis") {
      const key = await this.secrets.resolve("artificial_analysis_api_key");
      if (!key)
        throw new BenchmarkServiceError(
          "CREDENTIAL_NOT_CONFIGURED",
          "Artificial Analysis credential is not configured",
          false,
        );
      const body = await this.fetchJson(AA_URL, { "x-api-key": key });
      const snapshot = normalizeArtificialAnalysis(body);
      await this.repository.replaceSnapshot(snapshot);
      return {
        count: snapshot.items.length,
        fetchedAt: snapshot.metadata.fetchedAt,
      };
    }

    const key = await this.secrets.resolve("openrouter_api_key");
    if (!key)
      throw new BenchmarkServiceError(
        "CREDENTIAL_NOT_CONFIGURED",
        "OpenRouter credential is not configured",
        false,
      );
    const headers = { Authorization: `Bearer ${key}` };
    const [aa, arena] = await Promise.all([
      this.fetchJson(`${OPENROUTER_URL}?source=artificial-analysis`, headers),
      this.fetchJson(`${OPENROUTER_URL}?source=design-arena`, headers),
    ]);
    const aaSnapshot = normalizeOpenRouter(aa, "artificial-analysis");
    const arenaSnapshot = normalizeOpenRouter(arena, "design-arena");
    const snapshot = {
      metadata: {
        catalog: "openrouter" as const,
        fetchedAt: new Date().toISOString(),
        count: aaSnapshot.items.length + arenaSnapshot.items.length,
        attribution: {
          label: "OpenRouter Benchmarks",
          url: OPENROUTER_URL,
          citation: null,
        },
      },
      items: [...aaSnapshot.items, ...arenaSnapshot.items],
    };
    await this.repository.replaceSnapshot(snapshot);
    return {
      count: snapshot.items.length,
      fetchedAt: snapshot.metadata.fetchedAt,
    };
  }

  private async fetchJson(url: string, headers: Record<string, string>) {
    let response: Response;
    try {
      response = await this.fetcher(url, {
        headers,
        signal: AbortSignal.timeout(20_000),
      });
    } catch {
      throw new BenchmarkServiceError(
        "UPSTREAM_UNAVAILABLE",
        "Benchmark provider is unavailable",
        true,
      );
    }
    if (response.status === 429) {
      throw new BenchmarkServiceError(
        "UPSTREAM_RATE_LIMIT",
        "Benchmark provider rate limit reached",
        true,
      );
    }
    if (!response.ok) {
      throw new BenchmarkServiceError(
        "UPSTREAM_UNAVAILABLE",
        "Benchmark provider is unavailable",
        true,
      );
    }
    try {
      return await response.json();
    } catch {
      throw new BenchmarkServiceError(
        "UPSTREAM_UNAVAILABLE",
        "Benchmark provider returned an invalid response",
        true,
      );
    }
  }
}

function compareNullable(
  left: number | null,
  right: number | null,
  sortDirection: "asc" | "desc",
) {
  const l = left ?? (sortDirection === "asc" ? Infinity : -Infinity);
  const r = right ?? (sortDirection === "asc" ? Infinity : -Infinity);
  return sortDirection === "asc" ? l - r : r - l;
}

function sortAa(
  items: ArtificialAnalysisBenchmarkItem[],
  input: BenchmarkListInput,
) {
  return [...items].sort((left, right) => {
    if (input.sort === "name")
      return input.sortDirection === "asc"
        ? left.name.localeCompare(right.name)
        : right.name.localeCompare(left.name);
    const field =
      input.sort === "price" ? "priceInput1mTokens" : "intelligenceIndex";
    const result = compareNullable(
      left[field],
      right[field],
      input.sortDirection,
    );
    return result || left.name.localeCompare(right.name);
  });
}

function sortOpenRouter(
  items: OpenRouterBenchmarkItem[],
  input: BenchmarkListInput,
) {
  return [...items].sort((left, right) => {
    if (input.sort === "name")
      return input.sortDirection === "asc"
        ? left.name.localeCompare(right.name)
        : right.name.localeCompare(left.name);
    const field =
      input.sort === "elo"
        ? "elo"
        : input.sort === "winRate"
          ? "winRate"
          : input.sort === "time"
            ? "averageTimeSeconds"
            : input.sort === "price"
              ? "priceInput1mTokens"
              : "intelligenceIndex";
    const result = compareNullable(
      left[field],
      right[field],
      input.sortDirection,
    );
    return result || left.name.localeCompare(right.name);
  });
}

function paginate<T>(
  metadata: BenchmarkPage<T>["metadata"],
  items: T[],
  input: BenchmarkListInput,
): BenchmarkPage<T> {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / input.pageSize));
  const page = Math.min(input.page, pageCount);
  return {
    metadata,
    items: items.slice((page - 1) * input.pageSize, page * input.pageSize),
    page,
    pageSize: input.pageSize,
    total,
    pageCount,
  };
}
