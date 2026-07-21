import {
  createTrustedAuditContext,
  type TrustedAuditContext,
} from "@lite-llm/llm-config-service/audit-context";
import type { RoleResult, SessionResult } from "@/features/auth/server/invites";

type AuthorizedSession = Extract<SessionResult, { ok: true }>["session"];

export type AuditContext = TrustedAuditContext;

export type AuditContextResult =
  | { ok: true; context: AuditContext }
  | {
      ok: false;
      error: {
        code: "UNAUTHENTICATED" | "FORBIDDEN";
        message: "Authentication required" | "Administrator role required";
      };
    };

export type AuditContextDeps = {
  getSession: () => Promise<SessionResult>;
  requireAdmin: (session: AuthorizedSession) => Promise<RoleResult>;
  createRequestId?: () => string;
};

/** Builds provenance solely from the authenticated server session. */
export async function createAuditContext(
  deps: AuditContextDeps,
): Promise<AuditContextResult> {
  const session = await deps.getSession();
  if (!session.ok) {
    return {
      ok: false,
      error: { code: "UNAUTHENTICATED", message: "Authentication required" },
    };
  }

  const role = await deps.requireAdmin(session.session);
  if (!role.ok) {
    return {
      ok: false,
      error: { code: "FORBIDDEN", message: "Administrator role required" },
    };
  }

  return {
    ok: true,
    context: createTrustedAuditContext({
      actorType: "user",
      actorId: session.session.user.id,
      actorRole: "admin",
      source: "ui",
      requestId: deps.createRequestId?.() ?? crypto.randomUUID(),
    }),
  };
}
