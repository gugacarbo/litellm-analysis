import { createServerFn } from "@tanstack/react-start";
import {
  type DomainError,
  emptyInputSchema,
  removeApplicationSecretInputSchema,
  replaceApplicationSecretInputSchema,
  testApplicationSecretInputSchema,
} from "../contracts/model-admin";
import {
  type ApplicationSecretsHandlerDeps,
  handleListApplicationSecrets,
  handleRemoveApplicationSecret,
  handleReplaceApplicationSecret,
  handleTestApplicationSecret,
} from "./application-secrets.handlers";

async function runtimeDeps(): Promise<
  ApplicationSecretsHandlerDeps | DomainError
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
    // This remains lazy so unauthorized requests cannot instantiate a service
    // that can read or decrypt an application secret.
    getService: async () => {
      const [{ getDb }, { ApplicationSecretsService }] = await Promise.all([
        import("@lite-llm/database/client"),
        import("@lite-llm/llm-config-service"),
      ]);
      return new ApplicationSecretsService({ db: getDb() });
    },
  };
}

async function withRuntime<T>(
  operation: (deps: ApplicationSecretsHandlerDeps) => Promise<T>,
): Promise<T | DomainError> {
  const deps = await runtimeDeps();
  return "getService" in deps ? operation(deps) : deps;
}

export const listApplicationSecrets = createServerFn({ method: "GET" })
  .validator(emptyInputSchema)
  .handler(() => withRuntime(handleListApplicationSecrets));

export const replaceApplicationSecret = createServerFn({ method: "POST" })
  .validator(replaceApplicationSecretInputSchema)
  .handler(({ data }) =>
    withRuntime((deps) => handleReplaceApplicationSecret(deps, data)),
  );

export const removeApplicationSecret = createServerFn({ method: "POST" })
  .validator(removeApplicationSecretInputSchema)
  .handler(({ data }) =>
    withRuntime((deps) => handleRemoveApplicationSecret(deps, data)),
  );

export const testApplicationSecret = createServerFn({ method: "POST" })
  .validator(testApplicationSecretInputSchema)
  .handler(({ data }) =>
    withRuntime((deps) => handleTestApplicationSecret(deps, data)),
  );
