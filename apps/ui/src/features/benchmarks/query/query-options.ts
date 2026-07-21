import { queryOptions } from "@tanstack/react-query";
import type {
  BenchmarkListInput,
  BenchmarkResult,
} from "../contracts/benchmarks";
import {
  listArtificialAnalysisBenchmarks,
  listOpenRouterBenchmarks,
} from "../server/benchmarks.functions";

export const benchmarkQueryKeys = {
  aa: (input: BenchmarkListInput) => ["benchmarks", "aa", input] as const,
  openrouter: (input: BenchmarkListInput) =>
    ["benchmarks", "openrouter", input] as const,
};

export class BenchmarkQueryError extends Error {
  constructor(
    readonly code: string,
    readonly retryable: boolean,
    message: string,
  ) {
    super(message);
  }
}

async function unwrap<T>(
  request: () => Promise<BenchmarkResult<T>>,
): Promise<T> {
  const result = await request();
  if (!result.ok)
    throw new BenchmarkQueryError(
      result.error.code,
      result.error.retryable,
      result.error.message,
    );
  return result.data;
}

export const benchmarkQueries = {
  aa: (input: BenchmarkListInput) =>
    queryOptions({
      queryKey: benchmarkQueryKeys.aa(input),
      queryFn: () =>
        unwrap(() => listArtificialAnalysisBenchmarks({ data: input })),
    }),
  openrouter: (input: BenchmarkListInput) =>
    queryOptions({
      queryKey: benchmarkQueryKeys.openrouter(input),
      queryFn: () => unwrap(() => listOpenRouterBenchmarks({ data: input })),
    }),
};
