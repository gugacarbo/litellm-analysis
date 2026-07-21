import type { BenchmarkCatalog } from "@lite-llm/contracts/benchmarks";
import type { RoleResult, SessionResult } from "@/features/auth/server/invites";
import type {
  BenchmarkListInput,
  BenchmarkResult,
} from "../contracts/benchmarks";
import { BenchmarkServiceError } from "./benchmark-errors";
import type { BenchmarksService } from "./benchmarks.service";

type AuthorizedSession = Extract<SessionResult, { ok: true }>["session"];
type BenchmarkApi = Pick<
  BenchmarksService,
  "listArtificialAnalysis" | "listOpenRouter" | "sync"
>;

export type BenchmarkHandlerDeps = {
  getSession: () => Promise<SessionResult>;
  requireAdmin: (session: AuthorizedSession) => Promise<RoleResult>;
  getService: () => Promise<BenchmarkApi>;
};

function error(
  code: "UNAUTHENTICATED" | "FORBIDDEN",
  message: string,
): BenchmarkResult<never> {
  return { ok: false, error: { code, message, retryable: false } };
}

function publicError(errorValue: unknown): BenchmarkResult<never> {
  if (errorValue instanceof BenchmarkServiceError) {
    return {
      ok: false,
      error: {
        code: errorValue.code,
        message: errorValue.message,
        retryable: errorValue.retryable,
      },
    };
  }
  return {
    ok: false,
    error: {
      code: "INTERNAL",
      message: "Internal server error",
      retryable: false,
    },
  };
}

async function read<T>(
  deps: BenchmarkHandlerDeps,
  operation: (service: BenchmarkApi) => Promise<T>,
): Promise<BenchmarkResult<T>> {
  const session = await deps.getSession();
  if (!session.ok) return error("UNAUTHENTICATED", session.error.message);
  try {
    return { ok: true, data: await operation(await deps.getService()) };
  } catch (cause) {
    return publicError(cause);
  }
}

async function write<T>(
  deps: BenchmarkHandlerDeps,
  operation: (service: BenchmarkApi) => Promise<T>,
): Promise<BenchmarkResult<T>> {
  const session = await deps.getSession();
  if (!session.ok) return error("UNAUTHENTICATED", session.error.message);
  const role = await deps.requireAdmin(session.session);
  if (!role.ok) return error("FORBIDDEN", role.error.message);
  try {
    return { ok: true, data: await operation(await deps.getService()) };
  } catch (cause) {
    return publicError(cause);
  }
}

export const handleListArtificialAnalysis = (
  deps: BenchmarkHandlerDeps,
  input: BenchmarkListInput,
) => read(deps, (service) => service.listArtificialAnalysis(input));
export const handleListOpenRouter = (
  deps: BenchmarkHandlerDeps,
  input: BenchmarkListInput,
) => read(deps, (service) => service.listOpenRouter(input));
export const handleSyncBenchmarks = (
  deps: BenchmarkHandlerDeps,
  catalog: BenchmarkCatalog,
) => write(deps, (service) => service.sync(catalog));
