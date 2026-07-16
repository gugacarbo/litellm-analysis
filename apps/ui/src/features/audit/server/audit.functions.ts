import { createServerFn } from "@tanstack/react-start";
import {
  auditEventIdInputSchema,
  auditListInputSchema,
} from "../contracts/audit";
import type { AuditDomainError } from "./audit.handlers";
import {
  type AuditHandlerDeps,
  handleGetAuditEvent,
  handleListAuditEvents,
} from "./audit.handlers";
import { createAuditContext } from "./audit-context";

async function runtimeDeps(): Promise<AuditHandlerDeps | AuditDomainError> {
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
        message: "Authentication required",
        retryable: false,
      },
    };
  }
  const auth = getAuth();
  return {
    getAuditContext: () =>
      createAuditContext({
        getSession: () => requireSession({ auth, request }),
        requireAdmin: (session) => requireRole({ session, role: "admin" }),
      }),
    // Do not import a database/service until the handler has established
    // authentication and the administrative role.
    getService: async () => {
      const [{ getDb }, { AuditEventsService }] = await Promise.all([
        import("@lite-llm/database/client"),
        import("@lite-llm/llm-config-service"),
      ]);
      return new AuditEventsService({ db: getDb() });
    },
  };
}

async function withRuntime<T>(
  operation: (deps: AuditHandlerDeps) => Promise<T>,
): Promise<T | AuditDomainError> {
  const deps = await runtimeDeps();
  return "getService" in deps ? operation(deps) : deps;
}

export const listAuditEvents = createServerFn({ method: "GET" })
  .validator(auditListInputSchema)
  .handler(({ data }) =>
    withRuntime((deps) => handleListAuditEvents(deps, data)),
  );

export const getAuditEvent = createServerFn({ method: "GET" })
  .validator(auditEventIdInputSchema)
  .handler(({ data }) =>
    withRuntime((deps) => handleGetAuditEvent(deps, data)),
  );
