# Review package

- Task: Task-C-1
- Base commit: c22e434a3fb31b00a29c961681a23d3575343115
- Head: HEAD (c22e434a3fb31b00a29c961681a23d3575343115; task changes are intentionally uncommitted during this execution phase)
- Source: task-owned working-tree diff against the recorded base

## Full diff

```diff
diff --git a/apps/ui/src/features/model-admin/contracts/model-admin.ts b/apps/ui/src/features/model-admin/contracts/model-admin.ts
index 858fef3c..0bdc7099 100644
--- a/apps/ui/src/features/model-admin/contracts/model-admin.ts
+++ b/apps/ui/src/features/model-admin/contracts/model-admin.ts
@@ -34,6 +34,43 @@ export type Result<T> = { ok: true; data: T } | DomainError;

 export const emptyInputSchema = z.object({});

+export const applicationSecretKeySchema = z.enum([
+  "artificial_analysis_api_key",
+  "openrouter_api_key",
+]);
+
+export type ApplicationSecretKey = z.infer<typeof applicationSecretKeySchema>;
+
+export const applicationSecretPublicSchema = z
+  .object({
+    key: applicationSecretKeySchema,
+    isConfigured: z.boolean(),
+    createdAt: z.date().nullable(),
+    updatedAt: z.date().nullable(),
+  })
+  .strict();
+
+export type ApplicationSecretPublic = z.infer<
+  typeof applicationSecretPublicSchema
+>;
+
+export const replaceApplicationSecretInputSchema = z.object({
+  key: applicationSecretKeySchema,
+  value: z.string().trim().min(1, "API key is required."),
+});
+
+export const removeApplicationSecretInputSchema = z.object({
+  key: applicationSecretKeySchema,
+});
+
+export type ReplaceApplicationSecretInput = z.infer<
+  typeof replaceApplicationSecretInputSchema
+>;
+
+export type RemoveApplicationSecretInput = z.infer<
+  typeof removeApplicationSecretInputSchema
+>;
+
 const uuidSchema = z.uuid();
 const revisionSchema = z.number().int().positive();
 const nullableText = z.string().nullable().optional();
diff --git a/apps/ui/src/features/model-admin/query/query-options.test.ts b/apps/ui/src/features/model-admin/query/query-options.test.ts
index 6b8e7327..61decf3f 100644
--- a/apps/ui/src/features/model-admin/query/query-options.test.ts
+++ b/apps/ui/src/features/model-admin/query/query-options.test.ts
@@ -10,6 +10,11 @@ vi.mock("@/features/model-admin/server/model-admin.functions", () => ({
   discoverModels: vi.fn(),
 }));

+vi.mock("@/features/model-admin/server/application-secrets.functions", () => ({
+  listApplicationSecrets: vi.fn(),
+}));
+
+import { listApplicationSecrets } from "@/features/model-admin/server/application-secrets.functions";
 import {
   discoverModels,
   listModels,
@@ -88,4 +93,18 @@ describe("model admin query options", () => {
       data: { providerId: "provider-a" },
     });
   });
+
+  it("consulta e invalida o status de segredos separadamente", async () => {
+    vi.mocked(listApplicationSecrets).mockResolvedValue({ ok: true, data: [] });
+    const queryClient = createModelAdminQueryClient();
+
+    await queryClient.fetchQuery(modelAdminQueries.applicationSecrets());
+    await invalidateModelAdmin.applicationSecrets(queryClient);
+
+    expect(listApplicationSecrets).toHaveBeenCalledWith({ data: {} });
+    expect(
+      queryClient.getQueryState(modelAdminQueryKeys.applicationSecrets.list)
+        ?.isInvalidated,
+    ).toBe(true);
+  });
 });
diff --git a/apps/ui/src/features/model-admin/query/query-options.ts b/apps/ui/src/features/model-admin/query/query-options.ts
index d0a9caf7..fc4b3c53 100644
--- a/apps/ui/src/features/model-admin/query/query-options.ts
+++ b/apps/ui/src/features/model-admin/query/query-options.ts
@@ -1,5 +1,6 @@
 import { type QueryClient, queryOptions } from "@tanstack/react-query";
 import type { Result } from "../contracts/model-admin";
+import { listApplicationSecrets } from "../server/application-secrets.functions";
 import {
   discoverModels,
   getModel,
@@ -33,6 +34,10 @@ export const modelAdminQueryKeys = {
     byProvider: (providerId: string) =>
       [...modelAdminKey, "discovery", providerId] as const,
   },
+  applicationSecrets: {
+    all: [...modelAdminKey, "application-secrets"] as const,
+    list: [...modelAdminKey, "application-secrets", "list"] as const,
+  },
 } as const;

 class ModelAdminQueryError extends Error {
@@ -85,6 +90,11 @@ export const modelAdminQueries = {
       queryFn: () =>
         unwrapResult(() => discoverModels({ data: { providerId } })),
     }),
+  applicationSecrets: () =>
+    queryOptions({
+      queryKey: modelAdminQueryKeys.applicationSecrets.list,
+      queryFn: () => unwrapResult(() => listApplicationSecrets({ data: {} })),
+    }),
 };

 export const invalidateModelAdmin = {
@@ -145,4 +155,8 @@ export const invalidateModelAdmin = {
     queryClient.invalidateQueries({
       queryKey: modelAdminQueryKeys.discovery.byProvider(providerId),
     }),
+  applicationSecrets: (queryClient: QueryClient) =>
+    queryClient.invalidateQueries({
+      queryKey: modelAdminQueryKeys.applicationSecrets.list,
+    }),
 };
diff --git a/apps/ui/src/routeTree.gen.ts b/apps/ui/src/routeTree.gen.ts
index a234af95..8fc2f323 100644
--- a/apps/ui/src/routeTree.gen.ts
+++ b/apps/ui/src/routeTree.gen.ts
@@ -17,6 +17,7 @@ import { Route as ProtectedModelsRouteImport } from './routes/_protected/models'
 import { Route as ProtectedModelsIndexRouteImport } from './routes/_protected/models/index'
 import { Route as ApiAuthAcceptInviteRouteImport } from './routes/api/auth/accept-invite'
 import { Route as ApiAuthSplatRouteImport } from './routes/api/auth/$'
+import { Route as ProtectedModelsSecretsRouteImport } from './routes/_protected/models/secrets'
 import { Route as ProtectedModelsAliasesRouteImport } from './routes/_protected/models/aliases'
 import { Route as ProtectedModelsModelIdSettingsRouteImport } from './routes/_protected/models/$modelId/settings'

@@ -59,6 +60,11 @@ const ApiAuthSplatRoute = ApiAuthSplatRouteImport.update({
   path: '/api/auth/$',
   getParentRoute: () => rootRouteImport,
 } as any)
+const ProtectedModelsSecretsRoute = ProtectedModelsSecretsRouteImport.update({
+  id: '/secrets',
+  path: '/secrets',
+  getParentRoute: () => ProtectedModelsRoute,
+} as any)
 const ProtectedModelsAliasesRoute = ProtectedModelsAliasesRouteImport.update({
   id: '/aliases',
   path: '/aliases',
@@ -77,6 +83,7 @@ export interface FileRoutesByFullPath {
   '/models': typeof ProtectedModelsRouteWithChildren
   '/providers': typeof ProtectedProvidersRoute
   '/models/aliases': typeof ProtectedModelsAliasesRoute
+  '/models/secrets': typeof ProtectedModelsSecretsRoute
   '/api/auth/$': typeof ApiAuthSplatRoute
   '/api/auth/accept-invite': typeof ApiAuthAcceptInviteRoute
   '/models/': typeof ProtectedModelsIndexRoute
@@ -87,6 +94,7 @@ export interface FileRoutesByTo {
   '/providers': typeof ProtectedProvidersRoute
   '/': typeof ProtectedIndexRoute
   '/models/aliases': typeof ProtectedModelsAliasesRoute
+  '/models/secrets': typeof ProtectedModelsSecretsRoute
   '/api/auth/$': typeof ApiAuthSplatRoute
   '/api/auth/accept-invite': typeof ApiAuthAcceptInviteRoute
   '/models': typeof ProtectedModelsIndexRoute
@@ -100,6 +108,7 @@ export interface FileRoutesById {
   '/_protected/providers': typeof ProtectedProvidersRoute
   '/_protected/': typeof ProtectedIndexRoute
   '/_protected/models/aliases': typeof ProtectedModelsAliasesRoute
+  '/_protected/models/secrets': typeof ProtectedModelsSecretsRoute
   '/api/auth/$': typeof ApiAuthSplatRoute
   '/api/auth/accept-invite': typeof ApiAuthAcceptInviteRoute
   '/_protected/models/': typeof ProtectedModelsIndexRoute
@@ -113,6 +122,7 @@ export interface FileRouteTypes {
     | '/models'
     | '/providers'
     | '/models/aliases'
+    | '/models/secrets'
     | '/api/auth/$'
     | '/api/auth/accept-invite'
     | '/models/'
@@ -123,6 +133,7 @@ export interface FileRouteTypes {
     | '/providers'
     | '/'
     | '/models/aliases'
+    | '/models/secrets'
     | '/api/auth/$'
     | '/api/auth/accept-invite'
     | '/models'
@@ -135,6 +146,7 @@ export interface FileRouteTypes {
     | '/_protected/providers'
     | '/_protected/'
     | '/_protected/models/aliases'
+    | '/_protected/models/secrets'
     | '/api/auth/$'
     | '/api/auth/accept-invite'
     | '/_protected/models/'
@@ -206,6 +218,13 @@ declare module '@tanstack/react-router' {
       preLoaderRoute: typeof ApiAuthSplatRouteImport
       parentRoute: typeof rootRouteImport
     }
+    '/_protected/models/secrets': {
+      id: '/_protected/models/secrets'
+      path: '/secrets'
+      fullPath: '/models/secrets'
+      preLoaderRoute: typeof ProtectedModelsSecretsRouteImport
+      parentRoute: typeof ProtectedModelsRoute
+    }
     '/_protected/models/aliases': {
       id: '/_protected/models/aliases'
       path: '/aliases'
@@ -225,12 +244,14 @@ declare module '@tanstack/react-router' {

 interface ProtectedModelsRouteChildren {
   ProtectedModelsAliasesRoute: typeof ProtectedModelsAliasesRoute
+  ProtectedModelsSecretsRoute: typeof ProtectedModelsSecretsRoute
   ProtectedModelsIndexRoute: typeof ProtectedModelsIndexRoute
   ProtectedModelsModelIdSettingsRoute: typeof ProtectedModelsModelIdSettingsRoute
 }

 const ProtectedModelsRouteChildren: ProtectedModelsRouteChildren = {
   ProtectedModelsAliasesRoute: ProtectedModelsAliasesRoute,
+  ProtectedModelsSecretsRoute: ProtectedModelsSecretsRoute,
   ProtectedModelsIndexRoute: ProtectedModelsIndexRoute,
   ProtectedModelsModelIdSettingsRoute: ProtectedModelsModelIdSettingsRoute,
 }

diff --git a/apps/ui/src/features/model-admin/server/application-secrets.functions.ts b/apps/ui/src/features/model-admin/server/application-secrets.functions.ts
new file mode 100644
index 00000000..cb852219
--- /dev/null
+++ b/apps/ui/src/features/model-admin/server/application-secrets.functions.ts
@@ -0,0 +1,72 @@
+import { createServerFn } from "@tanstack/react-start";
+import {
+  type DomainError,
+  emptyInputSchema,
+  removeApplicationSecretInputSchema,
+  replaceApplicationSecretInputSchema,
+} from "../contracts/model-admin";
+import {
+  type ApplicationSecretsHandlerDeps,
+  handleListApplicationSecrets,
+  handleRemoveApplicationSecret,
+  handleReplaceApplicationSecret,
+} from "./application-secrets.handlers";
+
+async function runtimeDeps(): Promise<
+  ApplicationSecretsHandlerDeps | DomainError
+> {
+  const [{ getAuth }, { getRequest }, { requireRole, requireSession }] =
+    await Promise.all([
+      import("@/features/auth/server/auth"),
+      import("@tanstack/react-start/server"),
+      import("@/features/auth/server/invites"),
+    ]);
+  const request = getRequest();
+  if (!request) {
+    return {
+      ok: false,
+      error: {
+        code: "UNAUTHENTICATED",
+        message: "No request",
+        retryable: false,
+      },
+    };
+  }
+  const auth = getAuth();
+  return {
+    getSession: () => requireSession({ auth, request }),
+    requireAdmin: (session) => requireRole({ session, role: "admin" }),
+    // This remains lazy so unauthorized requests cannot instantiate a service
+    // that can read or decrypt an application secret.
+    getService: async () => {
+      const [{ getDb }, { ApplicationSecretsService }] = await Promise.all([
+        import("@lite-llm/database/client"),
+        import("@lite-llm/llm-config-service"),
+      ]);
+      return new ApplicationSecretsService({ db: getDb() });
+    },
+  };
+}
+
+async function withRuntime<T>(
+  operation: (deps: ApplicationSecretsHandlerDeps) => Promise<T>,
+): Promise<T | DomainError> {
+  const deps = await runtimeDeps();
+  return "getService" in deps ? operation(deps) : deps;
+}
+
+export const listApplicationSecrets = createServerFn({ method: "GET" })
+  .validator(emptyInputSchema)
+  .handler(() => withRuntime(handleListApplicationSecrets));
+
+export const replaceApplicationSecret = createServerFn({ method: "POST" })
+  .validator(replaceApplicationSecretInputSchema)
+  .handler(({ data }) =>
+    withRuntime((deps) => handleReplaceApplicationSecret(deps, data)),
+  );
+
+export const removeApplicationSecret = createServerFn({ method: "POST" })
+  .validator(removeApplicationSecretInputSchema)
+  .handler(({ data }) =>
+    withRuntime((deps) => handleRemoveApplicationSecret(deps, data)),
+  );

diff --git a/apps/ui/src/features/model-admin/server/application-secrets.handlers.ts b/apps/ui/src/features/model-admin/server/application-secrets.handlers.ts
new file mode 100644
index 00000000..90ad91a5
--- /dev/null
+++ b/apps/ui/src/features/model-admin/server/application-secrets.handlers.ts
@@ -0,0 +1,120 @@
+import type { IApplicationSecretsService } from "@lite-llm/llm-config-service";
+import type { RoleResult, SessionResult } from "@/features/auth/server/invites";
+import type {
+  DomainError,
+  RemoveApplicationSecretInput,
+  ReplaceApplicationSecretInput,
+  Result,
+} from "../contracts/model-admin";
+import {
+  applicationSecretPublicSchema,
+  removeApplicationSecretInputSchema,
+  replaceApplicationSecretInputSchema,
+} from "../contracts/model-admin";
+
+type ApplicationSecretsApi = Pick<
+  IApplicationSecretsService,
+  "list" | "replace" | "remove"
+>;
+
+type AuthorizedSession = Extract<SessionResult, { ok: true }>["session"];
+
+export type ApplicationSecretsHandlerDeps = {
+  getSession: () => Promise<SessionResult>;
+  requireAdmin: (session: AuthorizedSession) => Promise<RoleResult>;
+  getService: () => Promise<ApplicationSecretsApi>;
+};
+
+function authError(
+  code: "UNAUTHENTICATED" | "FORBIDDEN",
+  message: string,
+): DomainError {
+  return { ok: false, error: { code, message, retryable: false } };
+}
+
+function validationError(
+  issues: readonly { path: PropertyKey[]; message: string }[],
+): DomainError {
+  const fieldErrors: Record<string, string[]> = {};
+  for (const issue of issues) {
+    const key = typeof issue.path[0] === "string" ? issue.path[0] : "form";
+    const messages = fieldErrors[key];
+    if (messages) {
+      messages.push(issue.message);
+    } else {
+      fieldErrors[key] = [issue.message];
+    }
+  }
+  return {
+    ok: false,
+    error: {
+      code: "VALIDATION",
+      message: "Invalid input",
+      retryable: false,
+      fieldErrors,
+    },
+  };
+}
+
+async function publicError(error: unknown): Promise<DomainError> {
+  const { ModelAdminError } = await import("@lite-llm/llm-config-service");
+  if (error instanceof ModelAdminError) return error.toPublic();
+  return {
+    ok: false,
+    error: {
+      code: "INTERNAL",
+      message: "Internal server error",
+      retryable: false,
+    },
+  };
+}
+
+async function withAdmin<T>(
+  deps: ApplicationSecretsHandlerDeps,
+  operation: (service: ApplicationSecretsApi) => Promise<T>,
+): Promise<Result<T>> {
+  const session = await deps.getSession();
+  if (!session.ok) return authError("UNAUTHENTICATED", session.error.message);
+
+  const role = await deps.requireAdmin(session.session);
+  if (!role.ok) return authError("FORBIDDEN", role.error.message);
+
+  try {
+    return { ok: true, data: await operation(await deps.getService()) };
+  } catch (error) {
+    return await publicError(error);
+  }
+}
+
+export const handleListApplicationSecrets = (
+  deps: ApplicationSecretsHandlerDeps,
+) =>
+  withAdmin(deps, async (service) =>
+    applicationSecretPublicSchema.array().parse(await service.list()),
+  );
+
+export async function handleReplaceApplicationSecret(
+  deps: ApplicationSecretsHandlerDeps,
+  input: ReplaceApplicationSecretInput,
+) {
+  const parsed = replaceApplicationSecretInputSchema.safeParse(input);
+  if (!parsed.success) return validationError(parsed.error.issues);
+
+  return withAdmin(deps, async (service) =>
+    applicationSecretPublicSchema.parse(
+      await service.replace(parsed.data.key, parsed.data.value),
+    ),
+  );
+}
+
+export async function handleRemoveApplicationSecret(
+  deps: ApplicationSecretsHandlerDeps,
+  input: RemoveApplicationSecretInput,
+) {
+  const parsed = removeApplicationSecretInputSchema.safeParse(input);
+  if (!parsed.success) return validationError(parsed.error.issues);
+
+  return withAdmin(deps, async (service) =>
+    applicationSecretPublicSchema.parse(await service.remove(parsed.data.key)),
+  );
+}

diff --git a/apps/ui/src/features/model-admin/server/application-secrets.handlers.test.ts b/apps/ui/src/features/model-admin/server/application-secrets.handlers.test.ts
new file mode 100644
index 00000000..321e5b7f
--- /dev/null
+++ b/apps/ui/src/features/model-admin/server/application-secrets.handlers.test.ts
@@ -0,0 +1,150 @@
+import { describe, expect, it, vi } from "vitest";
+import {
+  type ApplicationSecretsHandlerDeps,
+  handleListApplicationSecrets,
+  handleRemoveApplicationSecret,
+  handleReplaceApplicationSecret,
+} from "./application-secrets.handlers";
+
+const configuredAt = new Date("2026-07-14T00:00:00.000Z");
+
+function createDeps(overrides: Partial<ApplicationSecretsHandlerDeps> = {}) {
+  const service = {
+    list: vi.fn().mockResolvedValue([
+      {
+        key: "artificial_analysis_api_key",
+        isConfigured: true,
+        createdAt: configuredAt,
+        updatedAt: configuredAt,
+      },
+      {
+        key: "openrouter_api_key",
+        isConfigured: false,
+        createdAt: null,
+        updatedAt: null,
+      },
+    ]),
+    replace: vi.fn().mockResolvedValue({
+      key: "artificial_analysis_api_key",
+      isConfigured: true,
+      createdAt: configuredAt,
+      updatedAt: configuredAt,
+    }),
+    remove: vi.fn().mockResolvedValue({
+      key: "artificial_analysis_api_key",
+      isConfigured: false,
+      createdAt: null,
+      updatedAt: null,
+    }),
+  };
+  return {
+    service,
+    deps: {
+      getSession: vi.fn().mockResolvedValue({
+        ok: true,
+        session: {
+          user: { id: "admin-1", role: "admin" },
+          session: { id: "session-1" },
+        },
+      }),
+      requireAdmin: vi.fn().mockResolvedValue({ ok: true }),
+      getService: vi.fn().mockResolvedValue(service),
+      ...overrides,
+    } satisfies ApplicationSecretsHandlerDeps,
+  };
+}
+
+describe("application secrets handlers", () => {
+  it("rejects an unauthenticated status request before resolving the service", async () => {
+    const { deps } = createDeps({
+      getSession: vi.fn().mockResolvedValue({
+        ok: false,
+        error: { code: "UNAUTHENTICATED", message: "No valid session found" },
+      }),
+    });
+
+    await expect(handleListApplicationSecrets(deps)).resolves.toEqual({
+      ok: false,
+      error: {
+        code: "UNAUTHENTICATED",
+        message: "No valid session found",
+        retryable: false,
+      },
+    });
+    expect(deps.getService).not.toHaveBeenCalled();
+  });
+
+  it("rejects a viewer status request before resolving the service", async () => {
+    const { deps } = createDeps({
+      getSession: vi.fn().mockResolvedValue({
+        ok: true,
+        session: {
+          user: { id: "viewer-1", role: "viewer" },
+          session: { id: "session-1" },
+        },
+      }),
+      requireAdmin: vi.fn().mockResolvedValue({
+        ok: false,
+        error: { code: "FORBIDDEN", message: "Role 'admin' required" },
+      }),
+    });
+
+    await expect(handleListApplicationSecrets(deps)).resolves.toEqual({
+      ok: false,
+      error: {
+        code: "FORBIDDEN",
+        message: "Role 'admin' required",
+        retryable: false,
+      },
+    });
+    expect(deps.getService).not.toHaveBeenCalled();
+  });
+
+  it("lets an admin list metadata only", async () => {
+    const { deps } = createDeps();
+
+    const result = await handleListApplicationSecrets(deps);
+
+    expect(result).toMatchObject({ ok: true });
+    expect(JSON.stringify(result)).not.toContain("credentialEnvelope");
+    expect(JSON.stringify(result)).not.toContain("plaintext");
+    expect(JSON.stringify(result)).not.toContain("ciphertext");
+  });
+
+  it("lets an admin replace and remove an allowlisted secret", async () => {
+    const { deps, service } = createDeps();
+
+    await expect(
+      handleReplaceApplicationSecret(deps, {
+        key: "artificial_analysis_api_key",
+        value: "new-private-value",
+      }),
+    ).resolves.toMatchObject({ ok: true });
+    await expect(
+      handleRemoveApplicationSecret(deps, {
+        key: "artificial_analysis_api_key",
+      }),
+    ).resolves.toMatchObject({ ok: true });
+
+    expect(service.replace).toHaveBeenCalledWith(
+      "artificial_analysis_api_key",
+      "new-private-value",
+    );
+    expect(service.remove).toHaveBeenCalledWith("artificial_analysis_api_key");
+  });
+
+  it("rejects unsupported keys and blank values before resolving the service", async () => {
+    const { deps } = createDeps();
+
+    await expect(
+      handleReplaceApplicationSecret(deps, {
+        key: "other_key" as never,
+        value: "   ",
+      }),
+    ).resolves.toMatchObject({
+      ok: false,
+      error: { code: "VALIDATION", retryable: false },
+    });
+    expect(deps.getService).not.toHaveBeenCalled();
+  });
+});

diff --git a/apps/ui/src/features/model-admin/secrets/secrets-page.tsx b/apps/ui/src/features/model-admin/secrets/secrets-page.tsx
new file mode 100644
index 00000000..11c1d6dd
--- /dev/null
+++ b/apps/ui/src/features/model-admin/secrets/secrets-page.tsx
@@ -0,0 +1,217 @@
+import { zodResolver } from "@hookform/resolvers/zod";
+import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
+import { useState } from "react";
+import { useForm } from "react-hook-form";
+import { Alert, AlertDescription } from "@/shared/components/ui/alert";
+import { Badge } from "@/shared/components/ui/badge";
+import { Button } from "@/shared/components/ui/button";
+import {
+  Card,
+  CardContent,
+  CardDescription,
+  CardHeader,
+  CardTitle,
+} from "@/shared/components/ui/card";
+import { Input } from "@/shared/components/ui/input";
+import type {
+  ApplicationSecretKey,
+  ApplicationSecretPublic,
+  ReplaceApplicationSecretInput,
+} from "../contracts/model-admin";
+import { replaceApplicationSecretInputSchema } from "../contracts/model-admin";
+import {
+  invalidateModelAdmin,
+  modelAdminQueries,
+} from "../query/query-options";
+import {
+  removeApplicationSecret,
+  replaceApplicationSecret,
+} from "../server/application-secrets.functions";
+
+const secretDefinitions: ReadonlyArray<{
+  key: ApplicationSecretKey;
+  name: string;
+}> = [
+  { key: "artificial_analysis_api_key", name: "Artificial Analysis" },
+  { key: "openrouter_api_key", name: "OpenRouter" },
+];
+
+function toErrorMessage(error: unknown): string {
+  if (typeof error === "object" && error !== null && "message" in error) {
+    return String(error.message);
+  }
+  return "The secret could not be updated. Try again.";
+}
+
+function requireSuccess<T>(
+  result: { ok: true; data: T } | { ok: false; error: unknown },
+): T {
+  if (result.ok) return result.data;
+  throw result.error;
+}
+
+export function SecretsPage() {
+  const queryClient = useQueryClient();
+  const secretsQuery = useQuery(modelAdminQueries.applicationSecrets());
+  const [editing, setEditing] = useState<ApplicationSecretKey | null>(null);
+  const [feedback, setFeedback] = useState<string | null>(null);
+  const form = useForm<ReplaceApplicationSecretInput>({
+    resolver: zodResolver(replaceApplicationSecretInputSchema),
+    defaultValues: { key: "artificial_analysis_api_key", value: "" },
+  });
+
+  const replaceMutation = useMutation({
+    mutationFn: async (input: ReplaceApplicationSecretInput) =>
+      requireSuccess(await replaceApplicationSecret({ data: input })),
+    onSuccess: async () => {
+      await invalidateModelAdmin.applicationSecrets(queryClient);
+      form.reset();
+      setEditing(null);
+      setFeedback("Secret saved.");
+    },
+    onError: (error) => setFeedback(toErrorMessage(error)),
+  });
+  const removeMutation = useMutation({
+    mutationFn: async (key: ApplicationSecretKey) =>
+      requireSuccess(await removeApplicationSecret({ data: { key } })),
+    onSuccess: async () => {
+      await invalidateModelAdmin.applicationSecrets(queryClient);
+      setFeedback("Secret removed.");
+    },
+    onError: (error) => setFeedback(toErrorMessage(error)),
+  });
+
+  if (secretsQuery.isLoading) {
+    return <section className="p-8">Loading application secrets…</section>;
+  }
+  if (secretsQuery.isError) {
+    return (
+      <section className="space-y-4 p-8">
+        <Alert variant="destructive">
+          <AlertDescription>{secretsQuery.error.message}</AlertDescription>
+        </Alert>
+        <Button onClick={() => void secretsQuery.refetch()}>Try again</Button>
+      </section>
+    );
+  }
+
+  const byKey = new Map(
+    (secretsQuery.data ?? []).map((secret) => [secret.key, secret]),
+  );
+
+  return (
+    <section className="space-y-6 p-6 md:p-8">
+      <header>
+        <h1 className="text-3xl font-bold">Application secrets</h1>
+        <p className="mt-2 text-muted-foreground">
+          Configure provider keys without exposing their values after save.
+        </p>
+      </header>
+
+      {feedback ? (
+        <Alert>
+          <AlertDescription>{feedback}</AlertDescription>
+        </Alert>
+      ) : null}
+
+      <div className="grid gap-4 lg:grid-cols-2">
+        {secretDefinitions.map((definition) => {
+          const secret: ApplicationSecretPublic = byKey.get(definition.key) ?? {
+            key: definition.key,
+            isConfigured: false,
+            createdAt: null,
+            updatedAt: null,
+          };
+          const isEditing = editing === definition.key;
+
+          return (
+            <Card key={definition.key}>
+              <CardHeader>
+                <CardTitle className="flex items-center justify-between gap-3">
+                  {definition.name}
+                  <Badge variant={secret.isConfigured ? "default" : "outline"}>
+                    {secret.isConfigured ? "Configured" : "Not configured"}
+                  </Badge>
+                </CardTitle>
+                <CardDescription>
+                  {secret.updatedAt
+                    ? `Last updated ${secret.updatedAt.toLocaleString()}`
+                    : "No key has been stored."}
+                </CardDescription>
+              </CardHeader>
+              <CardContent className="space-y-3">
+                {isEditing ? (
+                  <form
+                    className="space-y-3"
+                    noValidate
+                    onSubmit={form.handleSubmit((input) => {
+                      setFeedback(null);
+                      replaceMutation.mutate(input);
+                    })}
+                  >
+                    <Input
+                      aria-label={`API key for ${definition.name}`}
+                      autoComplete="off"
+                      aria-invalid={Boolean(form.formState.errors.value)}
+                      type="password"
+                      {...form.register("value")}
+                    />
+                    {form.formState.errors.value?.message ? (
+                      <p className="text-destructive text-sm">
+                        {form.formState.errors.value.message}
+                      </p>
+                    ) : null}
+                    <div className="flex gap-2">
+                      <Button
+                        disabled={replaceMutation.isPending}
+                        type="submit"
+                      >
+                        Save key
+                      </Button>
+                      <Button
+                        onClick={() => {
+                          setEditing(null);
+                          form.reset();
+                        }}
+                        type="button"
+                        variant="outline"
+                      >
+                        Cancel
+                      </Button>
+                    </div>
+                  </form>
+                ) : (
+                  <div className="flex flex-wrap gap-2">
+                    <Button
+                      onClick={() => {
+                        setFeedback(null);
+                        form.reset({ key: definition.key, value: "" });
+                        setEditing(definition.key);
+                      }}
+                      type="button"
+                    >
+                      {secret.isConfigured ? "Replace key" : "Set key"}
+                    </Button>
+                    {secret.isConfigured ? (
+                      <Button
+                        disabled={removeMutation.isPending}
+                        onClick={() => {
+                          setFeedback(null);
+                          removeMutation.mutate(definition.key);
+                        }}
+                        type="button"
+                        variant="destructive"
+                      >
+                        Remove key
+                      </Button>
+                    ) : null}
+                  </div>
+                )}
+              </CardContent>
+            </Card>
+          );
+        })}
+      </div>
+    </section>
+  );
+}

diff --git a/apps/ui/src/features/model-admin/secrets/secrets-page.test.tsx b/apps/ui/src/features/model-admin/secrets/secrets-page.test.tsx
new file mode 100644
index 00000000..76f1a6b3
--- /dev/null
+++ b/apps/ui/src/features/model-admin/secrets/secrets-page.test.tsx
@@ -0,0 +1,118 @@
+/** @vitest-environment jsdom */
+
+import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
+import {
+  cleanup,
+  fireEvent,
+  render,
+  screen,
+  waitFor,
+} from "@testing-library/react";
+import { createElement } from "react";
+import { afterEach, describe, expect, it, vi } from "vitest";
+import {
+  listApplicationSecrets,
+  replaceApplicationSecret,
+} from "../server/application-secrets.functions";
+import { SecretsPage } from "./secrets-page";
+
+vi.mock("@/features/model-admin/server/application-secrets.functions", () => ({
+  listApplicationSecrets: vi.fn(),
+  replaceApplicationSecret: vi.fn(),
+  removeApplicationSecret: vi.fn(),
+}));
+
+function renderPage() {
+  vi.mocked(listApplicationSecrets).mockResolvedValue({
+    ok: true,
+    data: [
+      {
+        key: "artificial_analysis_api_key",
+        isConfigured: true,
+        createdAt: new Date("2026-07-14T00:00:00.000Z"),
+        updatedAt: new Date("2026-07-14T00:00:00.000Z"),
+      },
+      {
+        key: "openrouter_api_key",
+        isConfigured: false,
+        createdAt: null,
+        updatedAt: null,
+      },
+    ],
+  });
+  const queryClient = new QueryClient({
+    defaultOptions: {
+      queries: { retry: false, staleTime: Number.POSITIVE_INFINITY },
+    },
+  });
+  queryClient.setQueryData(
+    ["model-admin", "application-secrets", "list"],
+    [
+      {
+        key: "artificial_analysis_api_key",
+        isConfigured: true,
+        createdAt: new Date("2026-07-14T00:00:00.000Z"),
+        updatedAt: new Date("2026-07-14T00:00:00.000Z"),
+      },
+      {
+        key: "openrouter_api_key",
+        isConfigured: false,
+        createdAt: null,
+        updatedAt: null,
+      },
+    ],
+  );
+
+  return render(
+    createElement(
+      QueryClientProvider,
+      { client: queryClient },
+      createElement(SecretsPage),
+    ),
+  );
+}
+
+afterEach(cleanup);
+
+describe("SecretsPage", () => {
+  it("renders the two fixed metadata-only statuses", () => {
+    renderPage();
+
+    expect(screen.getByText("Artificial Analysis")).toBeTruthy();
+    expect(screen.getByText("OpenRouter")).toBeTruthy();
+    expect(screen.getByText("Configured")).toBeTruthy();
+    expect(screen.getByText("Not configured")).toBeTruthy();
+    expect(screen.queryByDisplayValue(/.+/)).toBeNull();
+  });
+
+  it("clears the password field after a successful replacement", async () => {
+    vi.mocked(replaceApplicationSecret).mockResolvedValueOnce({
+      ok: true,
+      data: {
+        key: "artificial_analysis_api_key",
+        isConfigured: true,
+        createdAt: new Date("2026-07-14T00:00:00.000Z"),
+        updatedAt: new Date("2026-07-14T00:00:00.000Z"),
+      },
+    });
+    renderPage();
+
+    fireEvent.click(screen.getByRole("button", { name: "Replace key" }));
+    const field = screen.getByLabelText("API key for Artificial Analysis");
+    fireEvent.change(field, { target: { value: "never-render-this-secret" } });
+    fireEvent.click(screen.getByRole("button", { name: "Save key" }));
+
+    await waitFor(() => {
+      expect(replaceApplicationSecret).toHaveBeenCalledWith({
+        data: {
+          key: "artificial_analysis_api_key",
+          value: "never-render-this-secret",
+        },
+      });
+      expect(
+        screen.queryByLabelText("API key for Artificial Analysis"),
+      ).toBeNull();
+      expect(screen.queryByDisplayValue("never-render-this-secret")).toBeNull();
+    });
+  });
+});

diff --git a/apps/ui/src/routes/_protected/models/secrets.tsx b/apps/ui/src/routes/_protected/models/secrets.tsx
new file mode 100644
index 00000000..76d3fca1
--- /dev/null
+++ b/apps/ui/src/routes/_protected/models/secrets.tsx
@@ -0,0 +1,9 @@
+import { createFileRoute } from "@tanstack/react-router";
+import { modelAdminQueries } from "@/features/model-admin/query/query-options";
+import { SecretsPage } from "@/features/model-admin/secrets/secrets-page";
+
+export const Route = createFileRoute("/_protected/models/secrets")({
+  loader: ({ context }) =>
+    context.queryClient.ensureQueryData(modelAdminQueries.applicationSecrets()),
+  component: SecretsPage,
+});

```
