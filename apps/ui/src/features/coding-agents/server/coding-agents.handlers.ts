import type { CodingAgentsService } from "@lite-llm/llm-config-service";
import type { RoleResult, SessionResult } from "@/features/auth/server/invites";
import type {
  CodingAgentDomainError,
  CodingAgentResult,
} from "../contracts/coding-agents";
import {
  codingAgentArtifactSchema,
  codingAgentsOverviewSchema,
} from "../contracts/coding-agents";

type CodingAgentsApi = Pick<
  CodingAgentsService,
  "getOverview" | "generateArtifact"
>;
type AuthorizedSession = Extract<SessionResult, { ok: true }>["session"];

export type CodingAgentsHandlerDeps = {
  getSession: () => Promise<SessionResult>;
  requireAdmin: (session: AuthorizedSession) => Promise<RoleResult>;
  getService: () => Promise<CodingAgentsApi>;
};

function authError(
  code: "UNAUTHENTICATED" | "FORBIDDEN",
  message: string,
): CodingAgentDomainError {
  return { ok: false, error: { code, message, retryable: false } };
}

async function withAdmin<T>(
  deps: CodingAgentsHandlerDeps,
  operation: (service: CodingAgentsApi) => Promise<T>,
): Promise<CodingAgentResult<T>> {
  const session = await deps.getSession();
  if (!session.ok) return authError("UNAUTHENTICATED", session.error.message);
  const role = await deps.requireAdmin(session.session);
  if (!role.ok) return authError("FORBIDDEN", role.error.message);
  try {
    return { ok: true, data: await operation(await deps.getService()) };
  } catch (cause) {
    const { ModelAdminError } = await import("@lite-llm/llm-config-service");
    if (cause instanceof ModelAdminError && cause.code === "VALIDATION") {
      return {
        ok: false,
        error: { code: "VALIDATION", message: cause.message, retryable: false },
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
}

export const handleGetCodingAgentsOverview = (deps: CodingAgentsHandlerDeps) =>
  withAdmin(deps, async (service) =>
    codingAgentsOverviewSchema.parse(await service.getOverview()),
  );

export const handleGenerateCodingAgentArtifact = (
  deps: CodingAgentsHandlerDeps,
  mode: "hebo" | "providers",
) =>
  withAdmin(deps, async (service) =>
    codingAgentArtifactSchema.parse(await service.generateArtifact(mode)),
  );
