import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Auth } from "./auth/auth";
import { getAuth } from "./auth/auth";
import { requireRole, requireSession } from "./auth/invites";
import type { ServerContext } from "./context";
import { createServerContext } from "./context";

export type RuntimeStatus = {
  ok: true;
  authenticated: true;
  runtime: "tanstack-start";
};

export type RuntimeStatusErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "INTERNAL";

export type RuntimeStatusResult =
  | RuntimeStatus
  | {
      ok: false;
      error: {
        code: RuntimeStatusErrorCode;
        message: string;
      };
    };

export type GetRuntimeStatusDeps = {
  auth: Auth;
  request: Request;
  ctx?: ServerContext;
};

/**
 * Pure handler logic — testable without TanStack Start runtime.
 * Extracted so unit tests can inject mocks directly.
 */
export async function handleGetRuntimeStatus(
  deps: GetRuntimeStatusDeps,
): Promise<RuntimeStatusResult> {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  const ctx = deps.ctx ?? createServerContext({ auth: deps.auth });

  try {
    // Validate session
    const sessionResult = await requireSession({
      auth: deps.auth,
      request: deps.request,
    });
    if (!sessionResult.ok) {
      ctx.logger.info("runtime_status_unauthenticated", {
        requestId,
        errorCode: sessionResult.error.code,
        durationMs: Date.now() - startTime,
      });
      return {
        ok: false as const,
        error: {
          code: "UNAUTHENTICATED" as const,
          message: sessionResult.error.message,
        },
      };
    }

    // Validate admin role
    const roleResult = await requireRole({
      session: sessionResult.session,
      role: "admin",
    });
    if (!roleResult.ok) {
      ctx.logger.info("runtime_status_forbidden", {
        requestId,
        userId: sessionResult.session.user.id,
        errorCode: roleResult.error.code,
        durationMs: Date.now() - startTime,
      });
      return {
        ok: false as const,
        error: {
          code: "FORBIDDEN" as const,
          message: roleResult.error.message,
        },
      };
    }

    ctx.logger.info("runtime_status_success", {
      requestId,
      userId: sessionResult.session.user.id,
      durationMs: Date.now() - startTime,
    });

    return {
      ok: true as const,
      authenticated: true as const,
      runtime: "tanstack-start" as const,
    };
  } catch {
    const durationMs = Date.now() - startTime;
    console.error(
      JSON.stringify({
        level: "error",
        event: "runtime_status_internal_error",
        requestId,
        errorCode: "INTERNAL",
        durationMs,
      }),
    );
    return {
      ok: false as const,
      error: { code: "INTERNAL" as const, message: "Internal server error" },
    };
  }
}

export const getRuntimeStatus = createServerFn({ method: "GET" })
  .validator(z.object({}))
  .handler(async ({ context }) => {
    const auth = getAuth();
    const request = (context as unknown as { request?: Request } | undefined)
      ?.request;
    if (!request) {
      const ctx = createServerContext({ auth });
      ctx.logger.error("runtime_status_no_request", {
        requestId: crypto.randomUUID(),
      });
      return {
        ok: false as const,
        error: {
          code: "INTERNAL" as const,
          message: "Internal server error",
        },
      };
    }

    return handleGetRuntimeStatus({ auth, request });
  });
