import type { IApplicationSecretsService } from "@lite-llm/llm-config-service";
import type { RoleResult, SessionResult } from "@/features/auth/server/invites";
import type {
  DomainError,
  RemoveApplicationSecretInput,
  ReplaceApplicationSecretInput,
  Result,
  TestApplicationSecretInput,
} from "../contracts/model-admin";
import {
  applicationSecretPublicSchema,
  removeApplicationSecretInputSchema,
  replaceApplicationSecretInputSchema,
  testApplicationSecretInputSchema,
  testApplicationSecretResultSchema,
} from "../contracts/model-admin";

type ApplicationSecretsApi = Pick<
  IApplicationSecretsService,
  "list" | "replace" | "remove" | "resolve"
>;

const applicationSecretTestEndpoints = {
  artificial_analysis_api_key: {
    url: "https://artificialanalysis.ai/api/v2/data/llms/models",
    headers: (key: string) => ({ "x-api-key": key }),
  },
  openrouter_api_key: {
    url: "https://openrouter.ai/api/v1/benchmarks",
    headers: (key: string) => ({ Authorization: `Bearer ${key}` }),
  },
} as const;

type AuthorizedSession = Extract<SessionResult, { ok: true }>["session"];

export type ApplicationSecretsHandlerDeps = {
  getSession: () => Promise<SessionResult>;
  requireAdmin: (session: AuthorizedSession) => Promise<RoleResult>;
  getService: () => Promise<ApplicationSecretsApi>;
};

function authError(
  code: "UNAUTHENTICATED" | "FORBIDDEN",
  message: string,
): DomainError {
  return { ok: false, error: { code, message, retryable: false } };
}

function validationError(
  issues: readonly { path: PropertyKey[]; message: string }[],
): DomainError {
  const fieldErrors: Record<string, string[]> = {};
  for (const issue of issues) {
    const key = typeof issue.path[0] === "string" ? issue.path[0] : "form";
    const messages = fieldErrors[key];
    if (messages) {
      messages.push(issue.message);
    } else {
      fieldErrors[key] = [issue.message];
    }
  }
  return {
    ok: false,
    error: {
      code: "VALIDATION",
      message: "Invalid input",
      retryable: false,
      fieldErrors,
    },
  };
}

async function publicError(error: unknown): Promise<DomainError> {
  const { ModelAdminError } = await import("@lite-llm/llm-config-service");
  if (error instanceof ModelAdminError) return error.toPublic();
  return {
    ok: false,
    error: {
      code: "INTERNAL",
      message: "Internal server error",
      retryable: false,
    },
  };
}

async function withAdmin<T>(
  deps: ApplicationSecretsHandlerDeps,
  operation: (service: ApplicationSecretsApi) => Promise<T>,
): Promise<Result<T>> {
  const session = await deps.getSession();
  if (!session.ok) return authError("UNAUTHENTICATED", session.error.message);

  const role = await deps.requireAdmin(session.session);
  if (!role.ok) return authError("FORBIDDEN", role.error.message);

  try {
    return { ok: true, data: await operation(await deps.getService()) };
  } catch (error) {
    return await publicError(error);
  }
}

export const handleListApplicationSecrets = (
  deps: ApplicationSecretsHandlerDeps,
) =>
  withAdmin(deps, async (service) =>
    applicationSecretPublicSchema.array().parse(await service.list()),
  );

export async function handleReplaceApplicationSecret(
  deps: ApplicationSecretsHandlerDeps,
  input: ReplaceApplicationSecretInput,
) {
  const parsed = replaceApplicationSecretInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error.issues);

  return withAdmin(deps, async (service) =>
    applicationSecretPublicSchema.parse(
      await service.replace(parsed.data.key, parsed.data.value),
    ),
  );
}

export async function handleRemoveApplicationSecret(
  deps: ApplicationSecretsHandlerDeps,
  input: RemoveApplicationSecretInput,
) {
  const parsed = removeApplicationSecretInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error.issues);

  return withAdmin(deps, async (service) =>
    applicationSecretPublicSchema.parse(await service.remove(parsed.data.key)),
  );
}

export async function handleTestApplicationSecret(
  deps: ApplicationSecretsHandlerDeps,
  input: TestApplicationSecretInput,
) {
  const parsed = testApplicationSecretInputSchema.safeParse(input);
  if (!parsed.success) return validationError(parsed.error.issues);

  return withAdmin(deps, async (service) => {
    const secret = await service.resolve(parsed.data.key);
    if (!secret) {
      const { ModelAdminError } = await import("@lite-llm/llm-config-service");
      throw new ModelAdminError(
        "VALIDATION",
        "Configure this secret before testing it.",
      );
    }

    const endpoint = applicationSecretTestEndpoints[parsed.data.key];
    let response: Response;
    try {
      response = await fetch(endpoint.url, {
        headers: endpoint.headers(secret),
        signal: AbortSignal.timeout(10_000),
      });
    } catch {
      const { ModelAdminError } = await import("@lite-llm/llm-config-service");
      throw new ModelAdminError(
        "UPSTREAM_UNAVAILABLE",
        "Could not reach the API.",
        { retryable: true },
      );
    }

    if (!response.ok) {
      const { ModelAdminError } = await import("@lite-llm/llm-config-service");
      const code =
        response.status === 429 ? "RATE_LIMITED" : "UPSTREAM_UNAVAILABLE";
      throw new ModelAdminError(
        code,
        response.status === 401 || response.status === 403
          ? "The API rejected this key."
          : `The API returned HTTP ${response.status}.`,
        { retryable: response.status >= 500 || response.status === 429 },
      );
    }

    return testApplicationSecretResultSchema.parse({
      message: "Connection successful.",
    });
  });
}
