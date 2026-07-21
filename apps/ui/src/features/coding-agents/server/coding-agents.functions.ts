import { createServerFn } from "@tanstack/react-start";
import {
  type CodingAgentDomainError,
  codingAgentArtifactInputSchema,
} from "../contracts/coding-agents";
import {
  type CodingAgentsHandlerDeps,
  handleGenerateCodingAgentArtifact,
  handleGetCodingAgentsOverview,
} from "./coding-agents.handlers";

async function runtimeDeps(): Promise<
  CodingAgentsHandlerDeps | CodingAgentDomainError
> {
  const [{ getAuth }, { getRequest }, { requireRole, requireSession }] =
    await Promise.all([
      import("@/features/auth/server/auth"),
      import("@tanstack/react-start/server"),
      import("@/features/auth/server/invites"),
    ]);
  const request = getRequest();
  if (!request)
    return {
      ok: false,
      error: {
        code: "UNAUTHENTICATED",
        message: "No request",
        retryable: false,
      },
    };
  const auth = getAuth();
  return {
    getSession: () => requireSession({ auth, request }),
    requireAdmin: (session) => requireRole({ session, role: "admin" }),
    getService: async () => {
      const [{ getDb }, { CodingAgentsService }] = await Promise.all([
        import("@lite-llm/database/client"),
        import("@lite-llm/llm-config-service"),
      ]);
      return new CodingAgentsService({ db: getDb() });
    },
  };
}

async function withRuntime<T>(
  operation: (deps: CodingAgentsHandlerDeps) => Promise<T>,
): Promise<T | CodingAgentDomainError> {
  const deps = await runtimeDeps();
  return "getService" in deps ? operation(deps) : deps;
}

export const getCodingAgentsOverview = createServerFn({
  method: "GET",
}).handler(() => withRuntime(handleGetCodingAgentsOverview));

export const generateCodingAgentArtifact = createServerFn({ method: "POST" })
  .validator(codingAgentArtifactInputSchema)
  .handler(({ data }) =>
    withRuntime((deps) => handleGenerateCodingAgentArtifact(deps, data.mode)),
  );
