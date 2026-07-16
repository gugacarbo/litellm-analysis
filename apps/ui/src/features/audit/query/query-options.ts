import type {
  AuditEventDetail,
  AuditEventListResult,
} from "@lite-llm/llm-config-service";
import { queryOptions } from "@tanstack/react-query";
import type { AuditEventIdInput, AuditListInput } from "../contracts/audit";
import { getAuditEvent, listAuditEvents } from "../server/audit.functions";
import type { AuditResult } from "../server/audit.handlers";

export const auditQueryKeys = {
  all: ["audit"] as const,
  list: (input: AuditListInput) => ["audit", "list", input] as const,
  detail: (id: string) => ["audit", "detail", id] as const,
};

class AuditQueryError extends Error {
  readonly code: string;

  constructor(error: { code: string; message: string }) {
    super(error.message);
    this.code = error.code;
  }
}

async function unwrap<T>(request: () => Promise<AuditResult<T>>): Promise<T> {
  const result = await request();
  if (!result.ok) throw new AuditQueryError(result.error);
  return result.data;
}

export const auditQueries = {
  list: (input: AuditListInput) =>
    queryOptions({
      queryKey: auditQueryKeys.list(input),
      queryFn: () =>
        unwrap<AuditEventListResult>(() => listAuditEvents({ data: input })),
    }),
  detail: (input: AuditEventIdInput) =>
    queryOptions({
      queryKey: auditQueryKeys.detail(input.id),
      queryFn: () =>
        unwrap<AuditEventDetail>(() => getAuditEvent({ data: input })),
    }),
};
