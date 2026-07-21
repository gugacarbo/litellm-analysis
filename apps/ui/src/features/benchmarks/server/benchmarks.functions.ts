import { createServerFn } from "@tanstack/react-start";
import type { BenchmarkResult } from "../contracts/benchmarks";
import {
  benchmarkListInputSchema,
  syncBenchmarkInputSchema,
} from "../contracts/benchmarks";
import {
  type BenchmarkHandlerDeps,
  handleListArtificialAnalysis,
  handleListOpenRouter,
  handleSyncBenchmarks,
} from "./benchmarks.handlers";

async function runtimeDeps(): Promise<
  BenchmarkHandlerDeps | BenchmarkResult<never>
> {
  const [{ getAuth }, { getRequest }, { requireRole, requireSession }] =
    await Promise.all([
      import("@/features/auth/server/auth"),
      import("@tanstack/react-start/server"),
      import("@/features/auth/server/invites"),
    ]);
  const request = getRequest();
  if (!request) {
    return {
      ok: false,
      error: {
        code: "UNAUTHENTICATED",
        message: "No request",
        retryable: false,
      },
    };
  }
  const auth = getAuth();
  return {
    getSession: () => requireSession({ auth, request }),
    requireAdmin: (session) => requireRole({ session, role: "admin" }),
    // This is deliberately lazy: viewers never instantiate a service capable
    // of resolving/decrypting an application credential or making an upstream call.
    getService: async () => {
      const [{ getDb }, { ApplicationSecretsService }, { BenchmarksService }] =
        await Promise.all([
          import("@lite-llm/database/client"),
          import("@lite-llm/llm-config-service"),
          import("./benchmarks.service"),
        ]);
      return new BenchmarksService(
        undefined,
        new ApplicationSecretsService({ db: getDb() }),
      );
    },
  };
}

export const listArtificialAnalysisBenchmarks = createServerFn({
  method: "GET",
})
  .validator(benchmarkListInputSchema)
  .handler(async ({ data }) => {
    const deps = await runtimeDeps();
    return "getService" in deps
      ? handleListArtificialAnalysis(deps, data)
      : deps;
  });

export const listOpenRouterBenchmarks = createServerFn({ method: "GET" })
  .validator(benchmarkListInputSchema)
  .handler(async ({ data }) => {
    const deps = await runtimeDeps();
    return "getService" in deps ? handleListOpenRouter(deps, data) : deps;
  });

export const syncBenchmarks = createServerFn({ method: "POST" })
  .validator(syncBenchmarkInputSchema)
  .handler(async ({ data }) => {
    const deps = await runtimeDeps();
    return "getService" in deps
      ? handleSyncBenchmarks(deps, data.catalog)
      : deps;
  });
