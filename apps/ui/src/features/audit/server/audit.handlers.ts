import type {
  AuditEventDetail,
  AuditEventListResult,
  IAuditEventsService,
} from "@lite-llm/llm-config-service";
import type { AuditEventIdInput, AuditListInput } from "../contracts/audit";
import type { AuditContextResult } from "./audit-context";

export type AuditDomainError = {
  ok: false;
  error: {
    code:
      | "UNAUTHENTICATED"
      | "FORBIDDEN"
      | "VALIDATION"
      | "NOT_FOUND"
      | "INTERNAL";
    message:
      | "Authentication required"
      | "Administrator role required"
      | "Invalid audit request"
      | "Audit event not found"
      | "Internal server error";
    retryable: false;
  };
};

export type AuditResult<T> = { ok: true; data: T } | AuditDomainError;

export type AuditHandlerDeps = {
  getAuditContext: () => Promise<AuditContextResult>;
  getService: () => Promise<
    Pick<IAuditEventsService, "list" | "getPublicById">
  >;
};

function error(
  code: AuditDomainError["error"]["code"],
  message: AuditDomainError["error"]["message"],
): AuditDomainError {
  return { ok: false, error: { code, message, retryable: false } };
}

function publicError(cause: unknown): AuditDomainError {
  if (cause instanceof Error && cause.name === "AuditEventError") {
    return (cause as { code?: unknown }).code === "NOT_FOUND"
      ? error("NOT_FOUND", "Audit event not found")
      : error("VALIDATION", "Invalid audit request");
  }
  return error("INTERNAL", "Internal server error");
}

async function withAuditContext<T>(
  deps: AuditHandlerDeps,
  operation: (
    service: Pick<IAuditEventsService, "list" | "getPublicById">,
  ) => Promise<T>,
): Promise<AuditResult<T>> {
  const context = await deps.getAuditContext();
  if (!context.ok) return error(context.error.code, context.error.message);
  try {
    return { ok: true, data: await operation(await deps.getService()) };
  } catch (cause) {
    return publicError(cause);
  }
}

export function handleListAuditEvents(
  deps: AuditHandlerDeps,
  input: AuditListInput,
): Promise<AuditResult<AuditEventListResult>> {
  return withAuditContext(deps, (service) => service.list(input));
}

export function handleGetAuditEvent(
  deps: AuditHandlerDeps,
  input: AuditEventIdInput,
): Promise<AuditResult<AuditEventDetail>> {
  return withAuditContext(deps, (service) => service.getPublicById(input.id));
}
