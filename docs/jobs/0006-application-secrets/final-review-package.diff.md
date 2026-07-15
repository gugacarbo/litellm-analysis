# Final review package

- Base commit: c22e434a3fb31b00a29c961681a23d3575343115
- Head: HEAD (c22e434a3fb31b00a29c961681a23d3575343115; implementation is intentionally uncommitted pending final audit)
- Source: full feature working-tree diff, excluding super-planning task artifacts

## Full diff

````diff
diff --git a/.env.example b/.env.example
index e9ad8ed1..adf191ed 100644
--- a/.env.example
+++ b/.env.example
@@ -20,6 +20,3 @@ BETTER_AUTH_TRUSTED_ORIGINS=http://localhost:5178
 VITE_APP_LOCALE=en-US
 VITE_APP_TIMEZONE=America/Sao_Paulo
 #
-# ── External Services ──
-ARTIFICIAL_ANALYSIS_API_KEY=
-OPENROUTER_API_KEY=
diff --git a/apps/server/src/__tests__/benchmark-sync-application-service.test.ts b/apps/server/src/__tests__/benchmark-sync-application-service.test.ts
index bd9a1374..2aea1ad8 100644
--- a/apps/server/src/__tests__/benchmark-sync-application-service.test.ts
+++ b/apps/server/src/__tests__/benchmark-sync-application-service.test.ts
@@ -21,13 +21,13 @@ function createService(
   runner: ConstructorParameters<
     typeof BenchmarkSyncApplicationService
   >[0]["runner"],
-  apiKey = "aa-key",
+  resolveApiKey = vi.fn().mockResolvedValue("aa-key"),
 ) {
   const outputDir = path.join(tempRoot, "benchmarks");
   return new BenchmarkSyncApplicationService({
     outputDir,
     datasetFilePath: path.join(outputDir, "artificial-analysis-models.json"),
-    artificialAnalysisApiKey: apiKey,
+    resolveApiKey,
     runner,
   });
 }
@@ -46,10 +46,14 @@ describe("BenchmarkSyncApplicationService", () => {
     const started = service.start();
     const duplicate = service.start();

-    expect(started.triggered).toBe(true);
-    expect(started.status).toBe("running");
-    expect(duplicate.triggered).toBe(false);
-    expect(duplicate.status).toBe("running");
+    await expect(started).resolves.toMatchObject({
+      triggered: true,
+      status: "running",
+    });
+    await expect(duplicate).resolves.toMatchObject({
+      triggered: false,
+      status: "running",
+    });
     expect(runner).toHaveBeenCalledOnce();

     resolveRun();
@@ -65,12 +69,12 @@ describe("BenchmarkSyncApplicationService", () => {
     try {
       const service = createService(vi.fn().mockResolvedValue(undefined));

-      service.start();
+      await service.start();
       await vi.waitFor(() => {
         expect(service.getStatus().status).toBe("succeeded");
       });

-      const immediateRetry = service.start();
+      const immediateRetry = await service.start();
       expect(immediateRetry.triggered).toBe(false);
       expect(immediateRetry.canTrigger).toBe(false);
       expect(immediateRetry.cooldownUntil).not.toBeNull();
@@ -83,7 +87,7 @@ describe("BenchmarkSyncApplicationService", () => {

       vi.setSystemTime(new Date("2026-07-06T19:00:01.000Z"));

-      const retryAfterCooldown = service.start();
+      const retryAfterCooldown = await service.start();
       expect(retryAfterCooldown.triggered).toBe(true);
     } finally {
       vi.useRealTimers();
@@ -92,9 +96,12 @@ describe("BenchmarkSyncApplicationService", () => {

   it("passes api key and output dir to the runner", async () => {
     const runner = vi.fn().mockResolvedValue(undefined);
-    const service = createService(runner, "server-aa-key");
+    const service = createService(
+      runner,
+      vi.fn().mockResolvedValue("server-aa-key"),
+    );

-    service.start();
+    await service.start();
     await vi.waitFor(() => {
       expect(service.getStatus().status).toBe("succeeded");
     });
@@ -112,7 +119,7 @@ describe("BenchmarkSyncApplicationService", () => {
       vi.fn().mockRejectedValue(new Error("AA unavailable")),
     );

-    service.start();
+    await service.start();

     await vi.waitFor(() => {
       const status = service.getStatus();
@@ -121,16 +128,84 @@ describe("BenchmarkSyncApplicationService", () => {
     });
   });

-  it("throws a configuration error when the AA api key is missing", () => {
-    const service = createService(vi.fn(), "");
+  it("throws a configuration error when the AA api key is missing", async () => {
+    const service = createService(vi.fn(), vi.fn().mockResolvedValue(null));

-    expect(() => service.start()).toThrow(BenchmarkSyncConfigurationError);
+    await expect(service.start()).rejects.toThrow(
+      BenchmarkSyncConfigurationError,
+    );
     expect(service.getStatus()).toMatchObject({
       status: "failed",
       lastError: "ARTIFICIAL_ANALYSIS_API_KEY is not configured",
     });
   });

+  it("resolves the key for each trigger instead of retaining a startup value", async () => {
+    const resolveApiKey = vi
+      .fn<() => Promise<string | null>>()
+      .mockResolvedValueOnce("first-aa-key")
+      .mockResolvedValueOnce("second-aa-key");
+    const runner = vi.fn().mockResolvedValue(undefined);
+    const service = createService(runner, resolveApiKey);
+
+    await service.start();
+    await vi.waitFor(() => {
+      expect(service.getStatus().status).toBe("succeeded");
+    });
+    await new Promise<void>((resolve) => setImmediate(resolve));
+
+    vi.useFakeTimers();
+    try {
+      vi.setSystemTime(
+        Date.parse(service.getStatus().lastSuccessAt ?? "") + 60 * 60_000 + 1,
+      );
+      await service.start();
+    } finally {
+      vi.useRealTimers();
+    }
+
+    expect(resolveApiKey).toHaveBeenCalledTimes(2);
+    expect(runner).toHaveBeenNthCalledWith(
+      1,
+      expect.objectContaining({ apiKey: "first-aa-key" }),
+    );
+    expect(runner).toHaveBeenNthCalledWith(
+      2,
+      expect.objectContaining({ apiKey: "second-aa-key" }),
+    );
+  });
+
+  it("treats an unreadable stored value as missing and never calls the runner", async () => {
+    const runner = vi.fn();
+    const service = createService(
+      runner,
+      vi.fn().mockRejectedValue(new Error("invalid envelope")),
+    );
+
+    await expect(service.start()).rejects.toThrow(
+      BenchmarkSyncConfigurationError,
+    );
+    expect(runner).not.toHaveBeenCalled();
+    expect(service.getStatus().lastError).toBe(
+      "ARTIFICIAL_ANALYSIS_API_KEY is not configured",
+    );
+  });
+
+  it("redacts a resolved key echoed by the runner", async () => {
+    const secret = "aa-secret-that-must-not-leak";
+    const service = createService(
+      vi.fn().mockRejectedValue(new Error(`upstream rejected ${secret}`)),
+      vi.fn().mockResolvedValue(secret),
+    );
+
+    await service.start();
+    await vi.waitFor(() => {
+      expect(service.getStatus().status).toBe("failed");
+    });
+
+    expect(service.getStatus().lastError).not.toContain(secret);
+  });
+
   it("reports whether the local dataset exists", async () => {
     const outputDir = path.join(tempRoot, "benchmarks");
     await mkdir(outputDir, { recursive: true });
diff --git a/apps/server/src/application/benchmark-sync-application-service.ts b/apps/server/src/application/benchmark-sync-application-service.ts
index 5bce78cd..84e399d0 100644
--- a/apps/server/src/application/benchmark-sync-application-service.ts
+++ b/apps/server/src/application/benchmark-sync-application-service.ts
@@ -15,10 +15,12 @@ type BenchmarkSyncRunner = (options: {
   outputDir: string;
 }) => Promise<void>;

+type BenchmarkSyncApiKeyResolver = () => Promise<string | null>;
+
 export interface BenchmarkSyncApplicationServiceOptions {
   outputDir: string;
   datasetFilePath: string;
-  artificialAnalysisApiKey?: string;
+  resolveApiKey: BenchmarkSyncApiKeyResolver;
   runner?: BenchmarkSyncRunner;
 }

@@ -35,9 +37,10 @@ export class BenchmarkSyncConfigurationError extends Error {}
 export class BenchmarkSyncApplicationService {
   private readonly outputDir: string;
   private readonly datasetFilePath: string;
-  private readonly artificialAnalysisApiKey?: string;
+  private readonly resolveApiKey: BenchmarkSyncApiKeyResolver;
   private readonly runner: BenchmarkSyncRunner;
   private inFlight: Promise<void> | null = null;
+  private isResolvingApiKey = false;
   private state: BenchmarkSyncState = {
     status: "idle",
     startedAt: null,
@@ -49,13 +52,14 @@ export class BenchmarkSyncApplicationService {
   constructor(options: BenchmarkSyncApplicationServiceOptions) {
     this.outputDir = options.outputDir;
     this.datasetFilePath = options.datasetFilePath;
-    this.artificialAnalysisApiKey = options.artificialAnalysisApiKey;
+    this.resolveApiKey = options.resolveApiKey;
     this.runner = options.runner ?? runSyncInProcess;
   }

   getStatus(): BenchmarkSyncStatusResponse {
     const cooldownUntil = getCooldownUntil(this.state.lastSuccessAt);
     const canTrigger =
+      !this.isResolvingApiKey &&
       this.state.status !== "running" &&
       (!cooldownUntil || Date.parse(cooldownUntil) <= Date.now());

@@ -68,25 +72,14 @@ export class BenchmarkSyncApplicationService {
     };
   }

-  start(): TriggerBenchmarkSyncResponse {
+  async start(): Promise<TriggerBenchmarkSyncResponse> {
     const currentStatus = this.getStatus();

-    if (this.inFlight || !currentStatus.canTrigger) {
+    if (this.inFlight || this.isResolvingApiKey || !currentStatus.canTrigger) {
       return { ...this.getStatus(), triggered: false };
     }

-    const apiKey = this.artificialAnalysisApiKey?.trim();
-    if (!apiKey) {
-      const message = "ARTIFICIAL_ANALYSIS_API_KEY is not configured";
-      this.state = {
-        ...this.state,
-        status: "failed",
-        finishedAt: new Date().toISOString(),
-        lastError: message,
-      };
-      throw new BenchmarkSyncConfigurationError(message);
-    }
-
+    this.isResolvingApiKey = true;
     const startedAt = new Date().toISOString();
     this.state = {
       status: "running",
@@ -96,34 +89,52 @@ export class BenchmarkSyncApplicationService {
       lastError: null,
     };

-    this.inFlight = this.runner({
-      apiKey,
-      outputDir: this.outputDir,
-    })
-      .then(() => {
-        const finishedAt = new Date().toISOString();
-        this.state = {
-          status: "succeeded",
-          startedAt,
-          finishedAt,
-          lastSuccessAt: finishedAt,
-          lastError: null,
-        };
-      })
-      .catch((error) => {
-        this.state = {
-          status: "failed",
-          startedAt,
-          finishedAt: new Date().toISOString(),
-          lastSuccessAt: this.state.lastSuccessAt,
-          lastError: normalizeError(error),
-        };
-      })
-      .finally(() => {
-        this.inFlight = null;
-      });
+    try {
+      const apiKey = await this.resolveApiKey();
+      if (!apiKey?.trim()) {
+        throw new Error("Application secret is unavailable");
+      }

-    return { ...this.getStatus(), triggered: true };
+      this.inFlight = this.runner({
+        apiKey,
+        outputDir: this.outputDir,
+      })
+        .then(() => {
+          const finishedAt = new Date().toISOString();
+          this.state = {
+            status: "succeeded",
+            startedAt,
+            finishedAt,
+            lastSuccessAt: finishedAt,
+            lastError: null,
+          };
+        })
+        .catch((error) => {
+          this.state = {
+            status: "failed",
+            startedAt,
+            finishedAt: new Date().toISOString(),
+            lastSuccessAt: this.state.lastSuccessAt,
+            lastError: normalizeError(error, apiKey),
+          };
+        })
+        .finally(() => {
+          this.inFlight = null;
+        });
+
+      return { ...this.getStatus(), triggered: true };
+    } catch {
+      const message = "ARTIFICIAL_ANALYSIS_API_KEY is not configured";
+      this.state = {
+        ...this.state,
+        status: "failed",
+        finishedAt: new Date().toISOString(),
+        lastError: message,
+      };
+      throw new BenchmarkSyncConfigurationError(message);
+    } finally {
+      this.isResolvingApiKey = false;
+    }
   }
 }

@@ -150,24 +161,25 @@ async function runSyncInProcess(options: {
   });
 }

-function normalizeError(error: unknown): string {
+function normalizeError(error: unknown, apiKey: string): string {
   const message = error instanceof Error ? error.message : String(error);
+  const redacted = message.split(apiKey).join("[REDACTED]");

-  return message.length > MAX_ERROR_LENGTH
-    ? `${message.slice(0, MAX_ERROR_LENGTH)}...`
-    : message;
+  return redacted.length > MAX_ERROR_LENGTH
+    ? `${redacted.slice(0, MAX_ERROR_LENGTH)}...`
+    : redacted;
 }

 export function createBenchmarkSyncApplicationService(options: {
   storagePath: string;
-  artificialAnalysisApiKey?: string;
+  resolveApiKey: BenchmarkSyncApiKeyResolver;
   runner?: BenchmarkSyncRunner;
 }): BenchmarkSyncApplicationService {
   const outputDir = path.join(options.storagePath, "benchmarks");
   return new BenchmarkSyncApplicationService({
     outputDir,
     datasetFilePath: path.join(outputDir, "artificial-analysis-models.json"),
-    artificialAnalysisApiKey: options.artificialAnalysisApiKey,
+    resolveApiKey: options.resolveApiKey,
     runner: options.runner,
   });
 }
diff --git a/apps/server/src/application/openrouter-benchmark-sync-application-service.ts b/apps/server/src/application/openrouter-benchmark-sync-application-service.ts
index 2921729b..ac7cfa92 100644
--- a/apps/server/src/application/openrouter-benchmark-sync-application-service.ts
+++ b/apps/server/src/application/openrouter-benchmark-sync-application-service.ts
@@ -14,10 +14,12 @@ type OpenRouterBenchmarkSyncRunner = (options: {
   outputDir: string;
 }) => Promise<void>;

+type OpenRouterBenchmarkSyncApiKeyResolver = () => Promise<string | null>;
+
 export interface OpenRouterBenchmarkSyncApplicationServiceOptions {
   outputDir: string;
   datasetFilePath: string;
-  openRouterApiKey?: string;
+  resolveApiKey: OpenRouterBenchmarkSyncApiKeyResolver;
   runner?: OpenRouterBenchmarkSyncRunner;
 }

@@ -34,9 +36,10 @@ export class OpenRouterBenchmarkSyncConfigurationError extends Error {}
 export class OpenRouterBenchmarkSyncApplicationService {
   private readonly outputDir: string;
   private readonly datasetFilePath: string;
-  private readonly openRouterApiKey?: string;
+  private readonly resolveApiKey: OpenRouterBenchmarkSyncApiKeyResolver;
   private readonly runner: OpenRouterBenchmarkSyncRunner;
   private inFlight: Promise<void> | null = null;
+  private isResolvingApiKey = false;
   private state: OpenRouterBenchmarkSyncState = {
     status: "idle",
     startedAt: null,
@@ -48,7 +51,7 @@ export class OpenRouterBenchmarkSyncApplicationService {
   constructor(options: OpenRouterBenchmarkSyncApplicationServiceOptions) {
     this.outputDir = options.outputDir;
     this.datasetFilePath = options.datasetFilePath;
-    this.openRouterApiKey = options.openRouterApiKey;
+    this.resolveApiKey = options.resolveApiKey;
     this.runner = options.runner ?? runSyncInProcess;
   }

@@ -57,28 +60,17 @@ export class OpenRouterBenchmarkSyncApplicationService {
       ...this.state,
       isRunning: this.state.status === "running",
       datasetExists: existsSync(this.datasetFilePath),
-      canTrigger: !this.inFlight,
+      canTrigger: !this.inFlight && !this.isResolvingApiKey,
       cooldownUntil: null,
     };
   }

-  start(): TriggerBenchmarkSyncResponse {
-    if (this.inFlight) {
+  async start(): Promise<TriggerBenchmarkSyncResponse> {
+    if (this.inFlight || this.isResolvingApiKey) {
       return { ...this.getStatus(), triggered: false };
     }

-    const apiKey = this.openRouterApiKey?.trim();
-    if (!apiKey) {
-      const message = "OPENROUTER_API_KEY is not configured";
-      this.state = {
-        ...this.state,
-        status: "failed",
-        finishedAt: new Date().toISOString(),
-        lastError: message,
-      };
-      throw new OpenRouterBenchmarkSyncConfigurationError(message);
-    }
-
+    this.isResolvingApiKey = true;
     const startedAt = new Date().toISOString();
     this.state = {
       status: "running",
@@ -88,34 +80,52 @@ export class OpenRouterBenchmarkSyncApplicationService {
       lastError: null,
     };

-    this.inFlight = this.runner({
-      apiKey,
-      outputDir: this.outputDir,
-    })
-      .then(() => {
-        const finishedAt = new Date().toISOString();
-        this.state = {
-          status: "succeeded",
-          startedAt,
-          finishedAt,
-          lastSuccessAt: finishedAt,
-          lastError: null,
-        };
-      })
-      .catch((error) => {
-        this.state = {
-          status: "failed",
-          startedAt,
-          finishedAt: new Date().toISOString(),
-          lastSuccessAt: this.state.lastSuccessAt,
-          lastError: normalizeError(error),
-        };
-      })
-      .finally(() => {
-        this.inFlight = null;
-      });
+    try {
+      const apiKey = await this.resolveApiKey();
+      if (!apiKey?.trim()) {
+        throw new Error("Application secret is unavailable");
+      }

-    return { ...this.getStatus(), triggered: true };
+      this.inFlight = this.runner({
+        apiKey,
+        outputDir: this.outputDir,
+      })
+        .then(() => {
+          const finishedAt = new Date().toISOString();
+          this.state = {
+            status: "succeeded",
+            startedAt,
+            finishedAt,
+            lastSuccessAt: finishedAt,
+            lastError: null,
+          };
+        })
+        .catch((error) => {
+          this.state = {
+            status: "failed",
+            startedAt,
+            finishedAt: new Date().toISOString(),
+            lastSuccessAt: this.state.lastSuccessAt,
+            lastError: normalizeError(error, apiKey),
+          };
+        })
+        .finally(() => {
+          this.inFlight = null;
+        });
+
+      return { ...this.getStatus(), triggered: true };
+    } catch {
+      const message = "OPENROUTER_API_KEY is not configured";
+      this.state = {
+        ...this.state,
+        status: "failed",
+        finishedAt: new Date().toISOString(),
+        lastError: message,
+      };
+      throw new OpenRouterBenchmarkSyncConfigurationError(message);
+    } finally {
+      this.isResolvingApiKey = false;
+    }
   }
 }

@@ -129,24 +139,25 @@ async function runSyncInProcess(options: {
   });
 }

-function normalizeError(error: unknown): string {
+function normalizeError(error: unknown, apiKey: string): string {
   const message = error instanceof Error ? error.message : String(error);
+  const redacted = message.split(apiKey).join("[REDACTED]");

-  return message.length > MAX_ERROR_LENGTH
-    ? `${message.slice(0, MAX_ERROR_LENGTH)}...`
-    : message;
+  return redacted.length > MAX_ERROR_LENGTH
+    ? `${redacted.slice(0, MAX_ERROR_LENGTH)}...`
+    : redacted;
 }

 export function createOpenRouterBenchmarkSyncApplicationService(options: {
   storagePath: string;
-  openRouterApiKey?: string;
+  resolveApiKey: OpenRouterBenchmarkSyncApiKeyResolver;
   runner?: OpenRouterBenchmarkSyncRunner;
 }): OpenRouterBenchmarkSyncApplicationService {
   const outputDir = path.join(options.storagePath, "benchmarks");
   return new OpenRouterBenchmarkSyncApplicationService({
     outputDir,
     datasetFilePath: path.join(outputDir, "openrouter-benchmarks.json"),
-    openRouterApiKey: options.openRouterApiKey,
+    resolveApiKey: options.resolveApiKey,
     runner: options.runner,
   });
 }
diff --git a/apps/server/src/routes/benchmark-sync-routes.ts b/apps/server/src/routes/benchmark-sync-routes.ts
index 3dcbf1ff..45bddace 100644
--- a/apps/server/src/routes/benchmark-sync-routes.ts
+++ b/apps/server/src/routes/benchmark-sync-routes.ts
@@ -13,9 +13,9 @@ export function createBenchmarkSyncRouter(
     res.json(service.getStatus());
   });

-  router.post("/sync", (_req, res) => {
+  router.post("/sync", async (_req, res) => {
     try {
-      const result = service.start();
+      const result = await service.start();
       res.status(result.triggered ? 202 : 200).json(result);
     } catch (error) {
       if (error instanceof BenchmarkSyncConfigurationError) {
diff --git a/apps/server/src/routes/openrouter-benchmark-sync-routes.ts b/apps/server/src/routes/openrouter-benchmark-sync-routes.ts
index d0ac4268..66a210c6 100644
--- a/apps/server/src/routes/openrouter-benchmark-sync-routes.ts
+++ b/apps/server/src/routes/openrouter-benchmark-sync-routes.ts
@@ -13,9 +13,9 @@ export function createOpenRouterBenchmarkSyncRouter(
     res.json(service.getStatus());
   });

-  router.post("/sync", (_req, res) => {
+  router.post("/sync", async (_req, res) => {
     try {
-      const result = service.start();
+      const result = await service.start();
       res.status(result.triggered ? 202 : 200).json(result);
     } catch (error) {
       if (error instanceof OpenRouterBenchmarkSyncConfigurationError) {
diff --git a/apps/server/src/runtime/app-runtime.ts b/apps/server/src/runtime/app-runtime.ts
index af8999f9..0c4f11b5 100644
--- a/apps/server/src/runtime/app-runtime.ts
+++ b/apps/server/src/runtime/app-runtime.ts
@@ -157,13 +157,15 @@ export async function startAppRuntime(): Promise<AppRuntime> {
   });
   const benchmarkSyncService = createBenchmarkSyncApplicationService({
     storagePath: resolveStoragePath(projectRoot),
-    artificialAnalysisApiKey: env.ARTIFICIAL_ANALYSIS_API_KEY,
+    resolveApiKey: () =>
+      registry.applicationSecretsService.resolve("artificial_analysis_api_key"),
   });

   const openRouterBenchmarkSyncService =
     createOpenRouterBenchmarkSyncApplicationService({
       storagePath: resolveStoragePath(projectRoot),
-      openRouterApiKey: env.OPENROUTER_API_KEY,
+      resolveApiKey: () =>
+        registry.applicationSecretsService.resolve("openrouter_api_key"),
     });

   const app = createApiServer(
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
diff --git a/database/drizzle/meta/_journal.json b/database/drizzle/meta/_journal.json
index 81f99e33..40fe5471 100644
--- a/database/drizzle/meta/_journal.json
+++ b/database/drizzle/meta/_journal.json
@@ -22,6 +22,13 @@
       "when": 1783727087377,
       "tag": "0002_sour_firebrand",
       "breakpoints": true
+    },
+    {
+      "idx": 3,
+      "version": "7",
+      "when": 1784076943644,
+      "tag": "0003_application-secrets-store",
+      "breakpoints": true
     }
   ]
-}
+}
\ No newline at end of file
diff --git a/database/src/schema/index.ts b/database/src/schema/index.ts
index 0dffb169..ecce697e 100644
--- a/database/src/schema/index.ts
+++ b/database/src/schema/index.ts
@@ -1,2 +1,7 @@
 export * from "./app/index";
+export {
+  type ApplicationSecret,
+  applicationSecretsStore,
+  type NewApplicationSecret,
+} from "./application-secrets";
 export * from "./model-proxy/index";
diff --git a/database/src/schema/model-proxy/schema-contract.test.ts b/database/src/schema/model-proxy/schema-contract.test.ts
index 27260bdb..548558cc 100644
--- a/database/src/schema/model-proxy/schema-contract.test.ts
+++ b/database/src/schema/model-proxy/schema-contract.test.ts
@@ -1,5 +1,6 @@
 import { getTableConfig } from "drizzle-orm/pg-core";
 import { describe, expect, it } from "vitest";
+import { applicationSecretsStore } from "../application-secrets";
 import { modelProxyAliases } from "./aliases";
 import { modelProxyModels } from "./models";
 import { modelProxyProviders } from "./providers";
@@ -11,6 +12,27 @@ function findIndex(table: Parameters<typeof getTableConfig>[0], name: string) {
 }

 describe("model proxy clean-cut schema", () => {
+  it("stores application secrets under a unique key with a required encrypted envelope", () => {
+    const keyIndex = findIndex(
+      applicationSecretsStore,
+      "uq_application_secrets_store_key",
+    );
+
+    expect(applicationSecretsStore.key.notNull).toBe(true);
+    expect(applicationSecretsStore.credentialEnvelope.notNull).toBe(true);
+    expect(keyIndex?.config.unique).toBe(true);
+    expect(
+      keyIndex?.config.columns.map(
+        (column) => (column as { name?: string }).name,
+      ),
+    ).toEqual(["key"]);
+    expect(
+      getTableConfig(applicationSecretsStore).checks.map(
+        (constraint) => constraint.name,
+      ),
+    ).toContain("ck_application_secrets_store_key_allowlist");
+  });
+
   it("requires a provider and prevents duplicate model ids inside one provider", () => {
     const providerForeignKey = getTableConfig(
       modelProxyModels,
diff --git a/docs/context/INFRA.md b/docs/context/INFRA.md
index f977b63e..3d896a91 100644
--- a/docs/context/INFRA.md
+++ b/docs/context/INFRA.md
@@ -57,9 +57,12 @@
 ```bash
 DATABASE_URL=postgresql://user:password@localhost:5432/lite_llm_analytics
 MODEL_PROXY_API_KEY=dev-key-123   # bootstrap para dev
-OPENROUTER_API_KEY=sk-or-...      # para sync de benchmarks do OpenRouter
````

+As chaves do Artificial Analysis e do OpenRouter para sincronizacao de
+benchmarks sao configuradas por um administrador no armazenamento de segredos
+da aplicacao; nao fazem parte do contrato de variaveis de ambiente. +

### Comandos

```bash
diff --git a/packages/config/src/server.ts b/packages/config/src/server.ts
index ce7c9c54..e046197c 100644
--- a/packages/config/src/server.ts
+++ b/packages/config/src/server.ts
@@ -21,9 +21,6 @@ const serverSchema = {
    .min(1, "MODEL_PROXY_API_KEY cannot be empty")
    .optional(),
  MODEL_PROXY_BASE_URL: z.url().optional(),
-  ARTIFICIAL_ANALYSIS_API_KEY: z.string().min(1).optional(),
-  OPENROUTER_API_KEY: z.string().min(1).optional(),
-
  STORAGE_PATH: z.string().default("@storage"),
};

diff --git a/services/llm-config-service/src/factory.ts b/services/llm-config-service/src/factory.ts
index 0c6e8a3b..8db5f76b 100644
--- a/services/llm-config-service/src/factory.ts
+++ b/services/llm-config-service/src/factory.ts
@@ -3,6 +3,10 @@ import {
  ApiKeysService,
  type IApiKeysService,
} from "./services/api-keys.service.js";
+import {
+  ApplicationSecretsService,
+  type IApplicationSecretsService,
+} from "./services/application-secrets.service.js";
import {
  type IOpenAiOAuthService,
  OpenAiOAuthService,
@@ -21,6 +25,7 @@ export interface RegistryServices {
  settingsService: ISettingsService;
  registryModelsService: IRegistryModelsService;
  apiKeysService: IApiKeysService;
+  applicationSecretsService: IApplicationSecretsService;
  openAiOAuthService: IOpenAiOAuthService;
}

@@ -38,6 +43,7 @@ export function createRegistryServices(
    settingsService: new SettingsService({ db }),
    registryModelsService: new RegistryModelsService({ db }),
    apiKeysService: new ApiKeysService({ db }),
+    applicationSecretsService: new ApplicationSecretsService({ db }),
    openAiOAuthService: new OpenAiOAuthService({ db }),
  };
}
diff --git a/services/llm-config-service/src/index.ts b/services/llm-config-service/src/index.ts
index 4ce96b4b..ae65e723 100644
--- a/services/llm-config-service/src/index.ts
+++ b/services/llm-config-service/src/index.ts
@@ -23,6 +23,13 @@ export {
  parseProviderEncryptionKey,
  resolveProviderCredential,
} from "./lib/provider-secrets.js";
+export {
+  APPLICATION_SECRET_KEYS,
+  type ApplicationSecretKey,
+  type ApplicationSecretRecord,
+  ApplicationSecretsRepository,
+  type ApplicationSecretsRepositoryPort,
+} from "./repositories/application-secrets-repository.js";
export { ModelsRepository } from "./repositories/models-repository.js";
export { SettingsRepository } from "./repositories/settings-repository.js";
export {
@@ -30,6 +37,12 @@ export {
  type ApiKeysServiceOptions,
  type IApiKeysService,
} from "./services/api-keys.service.js";
+export {
+  type ApplicationSecretPublic,
+  ApplicationSecretsService,
+  type ApplicationSecretsServiceOptions,
+  type IApplicationSecretsService,
+} from "./services/application-secrets.service.js";
export {
  ModelAdminService,
  type ModelAdminServiceOptions,

diff --git a/apps/server/src/__tests__/benchmark-sync-routes.test.ts b/apps/server/src/__tests__/benchmark-sync-routes.test.ts
new file mode 100644
index 00000000..3ba9f8a0
--- /dev/null
+++ b/apps/server/src/__tests__/benchmark-sync-routes.test.ts
@@ -0,0 +1,82 @@
+import type { AddressInfo } from "node:net";
+import { afterEach, describe, expect, it } from "vitest";
+import { BenchmarkSyncConfigurationError } from "../application/benchmark-sync-application-service";
+import { OpenRouterBenchmarkSyncConfigurationError } from "../application/openrouter-benchmark-sync-application-service";
+import { createBenchmarkSyncRouter } from "../routes/benchmark-sync-routes";
+import { createOpenRouterBenchmarkSyncRouter } from "../routes/openrouter-benchmark-sync-routes";
+
+type HttpServer = {
+  close: (callback: (error?: Error) => void) => void;
+};
+
+async function createSyncServer(
+  router: ReturnType<typeof createBenchmarkSyncRouter>,
+) {
+  const express = (await import("express")).default;
+  const app = express();
+  app.use(router);
+  const server = app.listen(0);
+  await new Promise<void>((resolve) => server.once("listening", resolve));
+  return { server, port: (server.address() as AddressInfo).port };
+}
+
+async function closeServer(server: HttpServer) {
+  await new Promise<void>((resolve, reject) => {
+    server.close((error) => (error ? reject(error) : resolve()));
+  });
+}
+
+describe("benchmark sync routes", () => {
+  const servers: HttpServer[] = [];
+
+  afterEach(async () => {
+    await Promise.all(servers.splice(0).map(closeServer));
+  });
+
+  it("maps an async Artificial Analysis missing-key error to the compatibility code", async () => {
+    const { server, port } = await createSyncServer(
+      createBenchmarkSyncRouter({
+        getStatus: () => ({}) as never,
+        start: async () => {
+          throw new BenchmarkSyncConfigurationError("missing");
+        },
+      } as never),
+    );
+    servers.push(server);
+
+    const response = await fetch(`http://127.0.0.1:${port}/sync`, {
+      method: "POST",
+    });
+
+    expect(response.status).toBe(503);
+    await expect(response.json()).resolves.toMatchObject({
+      code: "ARTIFICIAL_ANALYSIS_API_KEY_MISSING",
+    });
+  });
+
+  it("maps an async OpenRouter missing-key error to the compatibility code", async () => {
+    const express = (await import("express")).default;
+    const app = express();
+    app.use(
+      createOpenRouterBenchmarkSyncRouter({
+        getStatus: () => ({}) as never,
+        start: async () => {
+          throw new OpenRouterBenchmarkSyncConfigurationError("missing");
+        },
+      } as never),
+    );
+    const server = app.listen(0);
+    await new Promise<void>((resolve) => server.once("listening", resolve));
+    servers.push(server);
+    const port = (server.address() as AddressInfo).port;
+
+    const response = await fetch(`http://127.0.0.1:${port}/sync`, {
+      method: "POST",
+    });
+
+    expect(response.status).toBe(503);
+    await expect(response.json()).resolves.toMatchObject({
+      code: "OPENROUTER_API_KEY_MISSING",
+    });
+  });
+});

diff --git a/apps/server/src/__tests__/openrouter-benchmark-sync-application-service.test.ts b/apps/server/src/__tests__/openrouter-benchmark-sync-application-service.test.ts
new file mode 100644
index 00000000..102d5065
--- /dev/null
+++ b/apps/server/src/__tests__/openrouter-benchmark-sync-application-service.test.ts
@@ -0,0 +1,96 @@
+import { mkdtemp, rm } from "node:fs/promises";
+import os from "node:os";
+import path from "node:path";
+import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
+import {
+  OpenRouterBenchmarkSyncApplicationService,
+  OpenRouterBenchmarkSyncConfigurationError,
+} from "../application/openrouter-benchmark-sync-application-service";
+
+let tempRoot: string;
+
+beforeEach(async () => {
+  tempRoot = await mkdtemp(
+    path.join(os.tmpdir(), "openrouter-benchmark-sync-"),
+  );
+});
+
+afterEach(async () => {
+  await rm(tempRoot, { recursive: true, force: true });
+});
+
+function createService(
+  runner: ConstructorParameters<
+    typeof OpenRouterBenchmarkSyncApplicationService
+  >[0]["runner"],
+  resolveApiKey = vi.fn().mockResolvedValue("openrouter-key"),
+) {
+  const outputDir = path.join(tempRoot, "benchmarks");
+  return new OpenRouterBenchmarkSyncApplicationService({
+    outputDir,
+    datasetFilePath: path.join(outputDir, "openrouter-benchmarks.json"),
+    resolveApiKey,
+    runner,
+  });
+}
+
+describe("OpenRouterBenchmarkSyncApplicationService", () => {
+  it("resolves the key at every trigger", async () => {
+    const resolveApiKey = vi
+      .fn<() => Promise<string | null>>()
+      .mockResolvedValueOnce("first-openrouter-key")
+      .mockResolvedValueOnce("second-openrouter-key");
+    const runner = vi.fn().mockResolvedValue(undefined);
+    const service = createService(runner, resolveApiKey);
+
+    await service.start();
+    await vi.waitFor(() => {
+      expect(service.getStatus().status).toBe("succeeded");
+    });
+    await vi.waitFor(() => {
+      expect(service.getStatus().canTrigger).toBe(true);
+    });
+    await service.start();
+
+    expect(resolveApiKey).toHaveBeenCalledTimes(2);
+    expect(runner).toHaveBeenNthCalledWith(
+      1,
+      expect.objectContaining({ apiKey: "first-openrouter-key" }),
+    );
+    expect(runner).toHaveBeenNthCalledWith(
+      2,
+      expect.objectContaining({ apiKey: "second-openrouter-key" }),
+    );
+  });
+
+  it("treats missing or unreadable values as configuration errors", async () => {
+    const runner = vi.fn();
+    const service = createService(
+      runner,
+      vi.fn().mockRejectedValue(new Error("corrupt envelope")),
+    );
+
+    await expect(service.start()).rejects.toThrow(
+      OpenRouterBenchmarkSyncConfigurationError,
+    );
+    expect(runner).not.toHaveBeenCalled();
+    expect(service.getStatus().lastError).toBe(
+      "OPENROUTER_API_KEY is not configured",
+    );
+  });
+
+  it("redacts a resolved key echoed by the runner", async () => {
+    const secret = "openrouter-secret-that-must-not-leak";
+    const service = createService(
+      vi.fn().mockRejectedValue(new Error(`upstream rejected ${secret}`)),
+      vi.fn().mockResolvedValue(secret),
+    );
+
+    await service.start();
+    await vi.waitFor(() => {
+      expect(service.getStatus().status).toBe("failed");
+    });
+
+    expect(service.getStatus().lastError).not.toContain(secret);
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

diff --git a/database/drizzle/0003_application-secrets-store.sql b/database/drizzle/0003_application-secrets-store.sql
new file mode 100644
index 00000000..8f7c0ee8
--- /dev/null
+++ b/database/drizzle/0003_application-secrets-store.sql
@@ -0,0 +1,10 @@
+CREATE TABLE "application_secrets_store" (
+	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
+	"key" text NOT NULL,
+	"credential_envelope" text NOT NULL,
+	"created_at" timestamp DEFAULT now() NOT NULL,
+	"updated_at" timestamp DEFAULT now() NOT NULL,
+	CONSTRAINT "ck_application_secrets_store_key_allowlist" CHECK ("application_secrets_store"."key" IN ('artificial_analysis_api_key', 'openrouter_api_key'))
+);
+--> statement-breakpoint
+CREATE UNIQUE INDEX "uq_application_secrets_store_key" ON "application_secrets_store" USING btree ("key");
\ No newline at end of file

diff --git a/database/drizzle/meta/0003_snapshot.json b/database/drizzle/meta/0003_snapshot.json
new file mode 100644
index 00000000..87edfa12
--- /dev/null
+++ b/database/drizzle/meta/0003_snapshot.json
@@ -0,0 +1,2111 @@
+{
+  "id": "c4207070-1228-4a3d-8b92-d9e951c6a393",
+  "prevId": "50c9ad7e-73f4-461c-a295-abc6ca8b4968",
+  "version": "7",
+  "dialect": "postgresql",
+  "tables": {
+    "public.application_secrets_store": {
+      "name": "application_secrets_store",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "uuid",
+          "primaryKey": true,
+          "notNull": true,
+          "default": "gen_random_uuid()"
+        },
+        "key": {
+          "name": "key",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "credential_envelope": {
+          "name": "credential_envelope",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        }
+      },
+      "indexes": {
+        "uq_application_secrets_store_key": {
+          "name": "uq_application_secrets_store_key",
+          "columns": [
+            {
+              "expression": "key",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": true,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {},
+      "policies": {},
+      "checkConstraints": {
+        "ck_application_secrets_store_key_allowlist": {
+          "name": "ck_application_secrets_store_key_allowlist",
+          "value": "\"application_secrets_store\".\"key\" IN ('artificial_analysis_api_key', 'openrouter_api_key')"
+        }
+      },
+      "isRLSEnabled": false
+    },
+    "public.account": {
+      "name": "account",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "account_id": {
+          "name": "account_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "provider_id": {
+          "name": "provider_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "user_id": {
+          "name": "user_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "access_token": {
+          "name": "access_token",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "refresh_token": {
+          "name": "refresh_token",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "id_token": {
+          "name": "id_token",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "access_token_expires_at": {
+          "name": "access_token_expires_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "refresh_token_expires_at": {
+          "name": "refresh_token_expires_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "scope": {
+          "name": "scope",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "password": {
+          "name": "password",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        }
+      },
+      "indexes": {
+        "account_user_id_idx": {
+          "name": "account_user_id_idx",
+          "columns": [
+            {
+              "expression": "user_id",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "account_user_id_user_id_fk": {
+          "name": "account_user_id_user_id_fk",
+          "tableFrom": "account",
+          "tableTo": "user",
+          "columnsFrom": [
+            "user_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {},
+      "policies": {},
+      "checkConstraints": {},
+      "isRLSEnabled": false
+    },
+    "public.alerts": {
+      "name": "alerts",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "serial",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "anomaly_type": {
+          "name": "anomaly_type",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "model": {
+          "name": "model",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "severity": {
+          "name": "severity",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "message": {
+          "name": "message",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "metadata": {
+          "name": "metadata",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "detected_at": {
+          "name": "detected_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "acknowledged_at": {
+          "name": "acknowledged_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {},
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {},
+      "policies": {},
+      "checkConstraints": {},
+      "isRLSEnabled": false
+    },
+    "public.app_invite": {
+      "name": "app_invite",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "email": {
+          "name": "email",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "token_hash": {
+          "name": "token_hash",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "role": {
+          "name": "role",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "'viewer'"
+        },
+        "expires_at": {
+          "name": "expires_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "used_at": {
+          "name": "used_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        },
+        "created_by_user_id": {
+          "name": "created_by_user_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        }
+      },
+      "indexes": {
+        "app_invite_token_hash_idx": {
+          "name": "app_invite_token_hash_idx",
+          "columns": [
+            {
+              "expression": "token_hash",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": true,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        },
+        "app_invite_email_idx": {
+          "name": "app_invite_email_idx",
+          "columns": [
+            {
+              "expression": "email",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "app_invite_created_by_user_id_user_id_fk": {
+          "name": "app_invite_created_by_user_id_user_id_fk",
+          "tableFrom": "app_invite",
+          "tableTo": "user",
+          "columnsFrom": [
+            "created_by_user_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "set null",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {},
+      "policies": {},
+      "checkConstraints": {},
+      "isRLSEnabled": false
+    },
+    "public.model_health_checks": {
+      "name": "model_health_checks",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "serial",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "model_name": {
+          "name": "model_name",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "status": {
+          "name": "status",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "response_time_ms": {
+          "name": "response_time_ms",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "ttft_ms": {
+          "name": "ttft_ms",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "output_tokens": {
+          "name": "output_tokens",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "tokens_per_second": {
+          "name": "tokens_per_second",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "status_code": {
+          "name": "status_code",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "prompt_sent": {
+          "name": "prompt_sent",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "response_received": {
+          "name": "response_received",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "request_payload": {
+          "name": "request_payload",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "response_payload": {
+          "name": "response_payload",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "error_message": {
+          "name": "error_message",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "source": {
+          "name": "source",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "'scheduled'"
+        },
+        "checked_at": {
+          "name": "checked_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {},
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {},
+      "policies": {},
+      "checkConstraints": {},
+      "isRLSEnabled": false
+    },
+    "public.session": {
+      "name": "session",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "expires_at": {
+          "name": "expires_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "token": {
+          "name": "token",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        },
+        "ip_address": {
+          "name": "ip_address",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "user_agent": {
+          "name": "user_agent",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "user_id": {
+          "name": "user_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        }
+      },
+      "indexes": {
+        "session_token_idx": {
+          "name": "session_token_idx",
+          "columns": [
+            {
+              "expression": "token",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": true,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        },
+        "session_user_id_idx": {
+          "name": "session_user_id_idx",
+          "columns": [
+            {
+              "expression": "user_id",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "session_user_id_user_id_fk": {
+          "name": "session_user_id_user_id_fk",
+          "tableFrom": "session",
+          "tableTo": "user",
+          "columnsFrom": [
+            "user_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {},
+      "policies": {},
+      "checkConstraints": {},
+      "isRLSEnabled": false
+    },
+    "public.user": {
+      "name": "user",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "name": {
+          "name": "name",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "email": {
+          "name": "email",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "email_verified": {
+          "name": "email_verified",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true,
+          "default": false
+        },
+        "image": {
+          "name": "image",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "role": {
+          "name": "role",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "'viewer'"
+        },
+        "banned": {
+          "name": "banned",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true,
+          "default": false
+        },
+        "ban_reason": {
+          "name": "ban_reason",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "ban_expires": {
+          "name": "ban_expires",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        }
+      },
+      "indexes": {
+        "user_email_idx": {
+          "name": "user_email_idx",
+          "columns": [
+            {
+              "expression": "email",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": true,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {},
+      "policies": {},
+      "checkConstraints": {},
+      "isRLSEnabled": false
+    },
+    "public.verification": {
+      "name": "verification",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "identifier": {
+          "name": "identifier",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "value": {
+          "name": "value",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "expires_at": {
+          "name": "expires_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        }
+      },
+      "indexes": {
+        "verification_identifier_idx": {
+          "name": "verification_identifier_idx",
+          "columns": [
+            {
+              "expression": "identifier",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {},
+      "policies": {},
+      "checkConstraints": {},
+      "isRLSEnabled": false
+    },
+    "public.model_proxy_aliases": {
+      "name": "model_proxy_aliases",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "uuid",
+          "primaryKey": true,
+          "notNull": true,
+          "default": "gen_random_uuid()"
+        },
+        "alias": {
+          "name": "alias",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "alias_normalized": {
+          "name": "alias_normalized",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "target_model_id": {
+          "name": "target_model_id",
+          "type": "uuid",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "revision": {
+          "name": "revision",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true,
+          "default": 1
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        }
+      },
+      "indexes": {
+        "uq_model_proxy_aliases_normalized": {
+          "name": "uq_model_proxy_aliases_normalized",
+          "columns": [
+            {
+              "expression": "alias_normalized",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": true,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "model_proxy_aliases_target_model_id_model_proxy_models_id_fk": {
+          "name": "model_proxy_aliases_target_model_id_model_proxy_models_id_fk",
+          "tableFrom": "model_proxy_aliases",
+          "tableTo": "model_proxy_models",
+          "columnsFrom": [
+            "target_model_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {},
+      "policies": {},
+      "checkConstraints": {},
+      "isRLSEnabled": false
+    },
+    "public.model_proxy_api_keys": {
+      "name": "model_proxy_api_keys",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "uuid",
+          "primaryKey": true,
+          "notNull": true,
+          "default": "gen_random_uuid()"
+        },
+        "label": {
+          "name": "label",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "key_hash": {
+          "name": "key_hash",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "enabled": {
+          "name": "enabled",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true,
+          "default": true
+        },
+        "last_used_at": {
+          "name": "last_used_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        }
+      },
+      "indexes": {
+        "idx_api_keys_enabled_label": {
+          "name": "idx_api_keys_enabled_label",
+          "columns": [
+            {
+              "expression": "enabled",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "label",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "model_proxy_api_keys_key_hash_unique": {
+          "name": "model_proxy_api_keys_key_hash_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "key_hash"
+          ]
+        }
+      },
+      "policies": {},
+      "checkConstraints": {},
+      "isRLSEnabled": false
+    },
+    "public.model_proxy_benchmarks": {
+      "name": "model_proxy_benchmarks",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "uuid",
+          "primaryKey": true,
+          "notNull": true,
+          "default": "gen_random_uuid()"
+        },
+        "aa_model_id": {
+          "name": "aa_model_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "source": {
+          "name": "source",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "name": {
+          "name": "name",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "slug": {
+          "name": "slug",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "creator_id": {
+          "name": "creator_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "creator_name": {
+          "name": "creator_name",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "creator_slug": {
+          "name": "creator_slug",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "intelligence_index": {
+          "name": "intelligence_index",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "coding_index": {
+          "name": "coding_index",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "math_index": {
+          "name": "math_index",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "mmlu_pro": {
+          "name": "mmlu_pro",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "gpqa": {
+          "name": "gpqa",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "hle": {
+          "name": "hle",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "livecodebench": {
+          "name": "livecodebench",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "scicode": {
+          "name": "scicode",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "math_500": {
+          "name": "math_500",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "aime": {
+          "name": "aime",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "aime_25": {
+          "name": "aime_25",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "tau2": {
+          "name": "tau2",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "ifbench": {
+          "name": "ifbench",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "lcr": {
+          "name": "lcr",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "terminalbench_hard": {
+          "name": "terminalbench_hard",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "price_input_1m_tokens": {
+          "name": "price_input_1m_tokens",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "price_output_1m_tokens": {
+          "name": "price_output_1m_tokens",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "price_blended_1m_tokens": {
+          "name": "price_blended_1m_tokens",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "median_output_tokens_per_second": {
+          "name": "median_output_tokens_per_second",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "median_ttft_seconds": {
+          "name": "median_ttft_seconds",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "median_ttft_answer_seconds": {
+          "name": "median_ttft_answer_seconds",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "source_url": {
+          "name": "source_url",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "fetched_at": {
+          "name": "fetched_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        }
+      },
+      "indexes": {
+        "uq_model_proxy_benchmarks_aa_model_id_source": {
+          "name": "uq_model_proxy_benchmarks_aa_model_id_source",
+          "columns": [
+            {
+              "expression": "aa_model_id",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "source",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": true,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {},
+      "policies": {},
+      "checkConstraints": {},
+      "isRLSEnabled": false
+    },
+    "public.model_proxy_messages": {
+      "name": "model_proxy_messages",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "request_id": {
+          "name": "request_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "role": {
+          "name": "role",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "content": {
+          "name": "content",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        }
+      },
+      "indexes": {
+        "idx_messages_request_created": {
+          "name": "idx_messages_request_created",
+          "columns": [
+            {
+              "expression": "request_id",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "created_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "model_proxy_messages_request_id_model_proxy_requests_id_fk": {
+          "name": "model_proxy_messages_request_id_model_proxy_requests_id_fk",
+          "tableFrom": "model_proxy_messages",
+          "tableTo": "model_proxy_requests",
+          "columnsFrom": [
+            "request_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {},
+      "policies": {},
+      "checkConstraints": {},
+      "isRLSEnabled": false
+    },
+    "public.model_proxy_models": {
+      "name": "model_proxy_models",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "uuid",
+          "primaryKey": true,
+          "notNull": true,
+          "default": "gen_random_uuid()"
+        },
+        "model_id": {
+          "name": "model_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "revision": {
+          "name": "revision",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true,
+          "default": 1
+        },
+        "enabled": {
+          "name": "enabled",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true,
+          "default": true
+        },
+        "display_name": {
+          "name": "display_name",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "family": {
+          "name": "family",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "canonical_slug": {
+          "name": "canonical_slug",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "description": {
+          "name": "description",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "context_length": {
+          "name": "context_length",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "max_completion_tokens": {
+          "name": "max_completion_tokens",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "knowledge_cutoff": {
+          "name": "knowledge_cutoff",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "expiration_date": {
+          "name": "expiration_date",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "architecture": {
+          "name": "architecture",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "reasoning": {
+          "name": "reasoning",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "supported_parameters": {
+          "name": "supported_parameters",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "default_parameters": {
+          "name": "default_parameters",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "per_request_limits": {
+          "name": "per_request_limits",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "pricing": {
+          "name": "pricing",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "request_options": {
+          "name": "request_options",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "provider_id": {
+          "name": "provider_id",
+          "type": "uuid",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "reasoning_api_id": {
+          "name": "reasoning_api_id",
+          "type": "uuid",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        }
+      },
+      "indexes": {
+        "uq_model_proxy_models_provider_model": {
+          "name": "uq_model_proxy_models_provider_model",
+          "columns": [
+            {
+              "expression": "provider_id",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "model_id",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": true,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        },
+        "idx_model_proxy_models_enabled_id": {
+          "name": "idx_model_proxy_models_enabled_id",
+          "columns": [
+            {
+              "expression": "enabled",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "model_id",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "model_proxy_models_provider_id_model_proxy_providers_id_fk": {
+          "name": "model_proxy_models_provider_id_model_proxy_providers_id_fk",
+          "tableFrom": "model_proxy_models",
+          "tableTo": "model_proxy_providers",
+          "columnsFrom": [
+            "provider_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "restrict",
+          "onUpdate": "no action"
+        },
+        "model_proxy_models_reasoning_api_id_model_proxy_reasoning_apis_id_fk": {
+          "name": "model_proxy_models_reasoning_api_id_model_proxy_reasoning_apis_id_fk",
+          "tableFrom": "model_proxy_models",
+          "tableTo": "model_proxy_reasoning_apis",
+          "columnsFrom": [
+            "reasoning_api_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "set null",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {},
+      "policies": {},
+      "checkConstraints": {},
+      "isRLSEnabled": false
+    },
+    "public.model_proxy_providers": {
+      "name": "model_proxy_providers",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "uuid",
+          "primaryKey": true,
+          "notNull": true,
+          "default": "gen_random_uuid()"
+        },
+        "name": {
+          "name": "name",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "is_default": {
+          "name": "is_default",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": true,
+          "default": false
+        },
+        "provider": {
+          "name": "provider",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "base_url": {
+          "name": "base_url",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "credential_envelope": {
+          "name": "credential_envelope",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "revision": {
+          "name": "revision",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true,
+          "default": 1
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        }
+      },
+      "indexes": {
+        "uq_model_proxy_providers_single_default": {
+          "name": "uq_model_proxy_providers_single_default",
+          "columns": [
+            {
+              "expression": "is_default",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": true,
+          "where": "\"model_proxy_providers\".\"is_default\" = true",
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "model_proxy_providers_name_unique": {
+          "name": "model_proxy_providers_name_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "name"
+          ]
+        }
+      },
+      "policies": {},
+      "checkConstraints": {},
+      "isRLSEnabled": false
+    },
+    "public.model_proxy_reasoning_apis": {
+      "name": "model_proxy_reasoning_apis",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "uuid",
+          "primaryKey": true,
+          "notNull": true,
+          "default": "gen_random_uuid()"
+        },
+        "slug": {
+          "name": "slug",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "provider_id": {
+          "name": "provider_id",
+          "type": "uuid",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "version": {
+          "name": "version",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "request_params": {
+          "name": "request_params",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "request_shape": {
+          "name": "request_shape",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "description": {
+          "name": "description",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        }
+      },
+      "indexes": {},
+      "foreignKeys": {
+        "model_proxy_reasoning_apis_provider_id_model_proxy_providers_id_fk": {
+          "name": "model_proxy_reasoning_apis_provider_id_model_proxy_providers_id_fk",
+          "tableFrom": "model_proxy_reasoning_apis",
+          "tableTo": "model_proxy_providers",
+          "columnsFrom": [
+            "provider_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "model_proxy_reasoning_apis_slug_unique": {
+          "name": "model_proxy_reasoning_apis_slug_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "slug"
+          ]
+        }
+      },
+      "policies": {},
+      "checkConstraints": {},
+      "isRLSEnabled": false
+    },
+    "public.model_proxy_requests": {
+      "name": "model_proxy_requests",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "upstream_request_id": {
+          "name": "upstream_request_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "model": {
+          "name": "model",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "upstream_model": {
+          "name": "upstream_model",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "upstream_base_url": {
+          "name": "upstream_base_url",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "status": {
+          "name": "status",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "started_at": {
+          "name": "started_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        },
+        "finished_at": {
+          "name": "finished_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "latency_ms": {
+          "name": "latency_ms",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "ttft_ms": {
+          "name": "ttft_ms",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "input_tokens": {
+          "name": "input_tokens",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "output_tokens": {
+          "name": "output_tokens",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "total_tokens": {
+          "name": "total_tokens",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "cached_tokens": {
+          "name": "cached_tokens",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "reasoning_tokens": {
+          "name": "reasoning_tokens",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "usage_estimated": {
+          "name": "usage_estimated",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "input_cost_per_token": {
+          "name": "input_cost_per_token",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "output_cost_per_token": {
+          "name": "output_cost_per_token",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "input_cost": {
+          "name": "input_cost",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "output_cost": {
+          "name": "output_cost",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "total_cost": {
+          "name": "total_cost",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "cost_estimated": {
+          "name": "cost_estimated",
+          "type": "boolean",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "estimated_cost_usd": {
+          "name": "estimated_cost_usd",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "error_summary": {
+          "name": "error_summary",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "error_type": {
+          "name": "error_type",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "error_message": {
+          "name": "error_message",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "error_status_code": {
+          "name": "error_status_code",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "error_details": {
+          "name": "error_details",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "request_body": {
+          "name": "request_body",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "response_body": {
+          "name": "response_body",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "response_headers": {
+          "name": "response_headers",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "api_key_alias": {
+          "name": "api_key_alias",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "end_user": {
+          "name": "end_user",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        }
+      },
+      "indexes": {
+        "idx_model_proxy_requests_model_started_at": {
+          "name": "idx_model_proxy_requests_model_started_at",
+          "columns": [
+            {
+              "expression": "model",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "started_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        },
+        "idx_model_proxy_requests_status_started_at": {
+          "name": "idx_model_proxy_requests_status_started_at",
+          "columns": [
+            {
+              "expression": "status",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "started_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        },
+        "idx_model_proxy_requests_apikey_started_at": {
+          "name": "idx_model_proxy_requests_apikey_started_at",
+          "columns": [
+            {
+              "expression": "api_key_alias",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "started_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        },
+        "idx_model_proxy_requests_enduser_started_at": {
+          "name": "idx_model_proxy_requests_enduser_started_at",
+          "columns": [
+            {
+              "expression": "end_user",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "started_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {},
+      "policies": {},
+      "checkConstraints": {},
+      "isRLSEnabled": false
+    },
+    "public.model_proxy_settings": {
+      "name": "model_proxy_settings",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "uuid",
+          "primaryKey": true,
+          "notNull": true,
+          "default": "gen_random_uuid()"
+        },
+        "key": {
+          "name": "key",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "value": {
+          "name": "value",
+          "type": "jsonb",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        },
+        "updated_at": {
+          "name": "updated_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        }
+      },
+      "indexes": {},
+      "foreignKeys": {},
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {
+        "model_proxy_settings_key_unique": {
+          "name": "model_proxy_settings_key_unique",
+          "nullsNotDistinct": false,
+          "columns": [
+            "key"
+          ]
+        }
+      },
+      "policies": {},
+      "checkConstraints": {},
+      "isRLSEnabled": false
+    },
+    "public.model_proxy_usage_adjustments": {
+      "name": "model_proxy_usage_adjustments",
+      "schema": "",
+      "columns": {
+        "id": {
+          "name": "id",
+          "type": "text",
+          "primaryKey": true,
+          "notNull": true
+        },
+        "request_id": {
+          "name": "request_id",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "reason": {
+          "name": "reason",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": true
+        },
+        "prompt_tokens_delta": {
+          "name": "prompt_tokens_delta",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true,
+          "default": 0
+        },
+        "completion_tokens_delta": {
+          "name": "completion_tokens_delta",
+          "type": "integer",
+          "primaryKey": false,
+          "notNull": true,
+          "default": 0
+        },
+        "total_cost_delta": {
+          "name": "total_cost_delta",
+          "type": "double precision",
+          "primaryKey": false,
+          "notNull": true,
+          "default": 0
+        },
+        "note": {
+          "name": "note",
+          "type": "text",
+          "primaryKey": false,
+          "notNull": false
+        },
+        "created_at": {
+          "name": "created_at",
+          "type": "timestamp",
+          "primaryKey": false,
+          "notNull": true,
+          "default": "now()"
+        }
+      },
+      "indexes": {
+        "idx_usage_adjustments_request_created": {
+          "name": "idx_usage_adjustments_request_created",
+          "columns": [
+            {
+              "expression": "request_id",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            },
+            {
+              "expression": "created_at",
+              "isExpression": false,
+              "asc": true,
+              "nulls": "last"
+            }
+          ],
+          "isUnique": false,
+          "concurrently": false,
+          "method": "btree",
+          "with": {}
+        }
+      },
+      "foreignKeys": {
+        "model_proxy_usage_adjustments_request_id_model_proxy_requests_id_fk": {
+          "name": "model_proxy_usage_adjustments_request_id_model_proxy_requests_id_fk",
+          "tableFrom": "model_proxy_usage_adjustments",
+          "tableTo": "model_proxy_requests",
+          "columnsFrom": [
+            "request_id"
+          ],
+          "columnsTo": [
+            "id"
+          ],
+          "onDelete": "cascade",
+          "onUpdate": "no action"
+        }
+      },
+      "compositePrimaryKeys": {},
+      "uniqueConstraints": {},
+      "policies": {},
+      "checkConstraints": {},
+      "isRLSEnabled": false
+    }
+  },
+  "enums": {},
+  "schemas": {},
+  "sequences": {},
+  "roles": {},
+  "policies": {},
+  "views": {},
+  "_meta": {
+    "columns": {},
+    "schemas": {},
+    "tables": {}
+  }
+}
\ No newline at end of file

diff --git a/database/src/schema/application-secrets.ts b/database/src/schema/application-secrets.ts
new file mode 100644
index 00000000..6ec7455e
--- /dev/null
+++ b/database/src/schema/application-secrets.ts
@@ -0,0 +1,27 @@
+import { sql } from "drizzle-orm";
+import { check, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
+import { modelProxyTable } from "./model-proxy/table";
+
+export const applicationSecretsStore = modelProxyTable(
+  "application_secrets_store",
+  {
+    id: uuid("id").defaultRandom().primaryKey(),
+    key: text("key").notNull(),
+    credentialEnvelope: text("credential_envelope").notNull(),
+    createdAt: timestamp("created_at").defaultNow().notNull(),
+    updatedAt: timestamp("updated_at")
+      .defaultNow()
+      .notNull()
+      .$onUpdate(() => new Date()),
+  },
+  (table) => [
+    uniqueIndex("uq_application_secrets_store_key").on(table.key),
+    check(
+      "ck_application_secrets_store_key_allowlist",
+      sql`${table.key} IN ('artificial_analysis_api_key', 'openrouter_api_key')`,
+    ),
+  ],
+);
+
+export type ApplicationSecret = typeof applicationSecretsStore.$inferSelect;
+export type NewApplicationSecret = typeof applicationSecretsStore.$inferInsert;

diff --git a/services/llm-config-service/src/repositories/application-secrets-repository.ts b/services/llm-config-service/src/repositories/application-secrets-repository.ts
new file mode 100644
index 00000000..fe7300ae
--- /dev/null
+++ b/services/llm-config-service/src/repositories/application-secrets-repository.ts
@@ -0,0 +1,108 @@
+import crypto from "node:crypto";
+import type { db as drizzleDb } from "@lite-llm/database/client";
+import { applicationSecretsStore } from "@lite-llm/database/schema";
+import { eq } from "drizzle-orm";
+
+export const APPLICATION_SECRET_KEYS = [
+  "artificial_analysis_api_key",
+  "openrouter_api_key",
+] as const;
+
+export type ApplicationSecretKey = (typeof APPLICATION_SECRET_KEYS)[number];
+
+export function isApplicationSecretKey(
+  value: string,
+): value is ApplicationSecretKey {
+  return APPLICATION_SECRET_KEYS.includes(value as ApplicationSecretKey);
+}
+
+function assertApplicationSecretKey(
+  value: string,
+): asserts value is ApplicationSecretKey {
+  if (!isApplicationSecretKey(value)) {
+    throw new Error("Unsupported application secret key");
+  }
+}
+
+export interface ApplicationSecretRecord {
+  key: ApplicationSecretKey;
+  credentialEnvelope: string;
+  createdAt: Date;
+  updatedAt: Date;
+}
+
+export interface ApplicationSecretUpsertData {
+  key: ApplicationSecretKey;
+  credentialEnvelope: string;
+}
+
+export interface ApplicationSecretsRepositoryPort {
+  findByKey(key: ApplicationSecretKey): Promise<ApplicationSecretRecord | null>;
+  upsert(data: ApplicationSecretUpsertData): Promise<ApplicationSecretRecord>;
+  deleteByKey(key: ApplicationSecretKey): Promise<boolean>;
+}
+
+function toRecord(row: {
+  key: string;
+  credentialEnvelope: string;
+  createdAt: Date;
+  updatedAt: Date;
+}): ApplicationSecretRecord {
+  return {
+    key: row.key as ApplicationSecretKey,
+    credentialEnvelope: row.credentialEnvelope,
+    createdAt: row.createdAt,
+    updatedAt: row.updatedAt,
+  };
+}
+
+export class ApplicationSecretsRepository
+  implements ApplicationSecretsRepositoryPort
+{
+  private readonly db: typeof drizzleDb;
+
+  constructor(db: typeof drizzleDb) {
+    this.db = db;
+  }
+
+  async findByKey(
+    key: ApplicationSecretKey,
+  ): Promise<ApplicationSecretRecord | null> {
+    const [row] = await this.db
+      .select()
+      .from(applicationSecretsStore)
+      .where(eq(applicationSecretsStore.key, key))
+      .limit(1);
+    return row ? toRecord(row) : null;
+  }
+
+  async upsert(
+    data: ApplicationSecretUpsertData,
+  ): Promise<ApplicationSecretRecord> {
+    assertApplicationSecretKey(data.key);
+    const [row] = await this.db
+      .insert(applicationSecretsStore)
+      .values({
+        id: crypto.randomUUID(),
+        key: data.key,
+        credentialEnvelope: data.credentialEnvelope,
+      })
+      .onConflictDoUpdate({
+        target: applicationSecretsStore.key,
+        set: {
+          credentialEnvelope: data.credentialEnvelope,
+          updatedAt: new Date(),
+        },
+      })
+      .returning();
+    return toRecord(row);
+  }
+
+  async deleteByKey(key: ApplicationSecretKey): Promise<boolean> {
+    const [deleted] = await this.db
+      .delete(applicationSecretsStore)
+      .where(eq(applicationSecretsStore.key, key))
+      .returning({ id: applicationSecretsStore.id });
+    return !!deleted;
+  }
+}

diff --git a/services/llm-config-service/src/services/application-secrets.service.ts b/services/llm-config-service/src/services/application-secrets.service.ts
new file mode 100644
index 00000000..fd800413
--- /dev/null
+++ b/services/llm-config-service/src/services/application-secrets.service.ts
@@ -0,0 +1,141 @@
+import type { DatabaseClient } from "@lite-llm/database/client";
+import {
+  encryptProviderSecret,
+  parseProviderEncryptionKey,
+  resolveProviderCredential,
+} from "../lib/provider-secrets.js";
+import {
+  APPLICATION_SECRET_KEYS,
+  type ApplicationSecretKey,
+  ApplicationSecretsRepository,
+  type ApplicationSecretsRepositoryPort,
+  isApplicationSecretKey,
+} from "../repositories/application-secrets-repository.js";
+
+export type { ApplicationSecretKey, ApplicationSecretsRepositoryPort };
+
+export interface ApplicationSecretPublic {
+  key: ApplicationSecretKey;
+  isConfigured: boolean;
+  createdAt: Date | null;
+  updatedAt: Date | null;
+}
+
+export interface ApplicationSecretsServiceOptions {
+  db?: DatabaseClient;
+  repository?: ApplicationSecretsRepositoryPort;
+  encryptionKey?: Buffer;
+}
+
+export interface IApplicationSecretsService {
+  list(): Promise<ApplicationSecretPublic[]>;
+  replace(
+    key: ApplicationSecretKey,
+    plaintext: string,
+  ): Promise<ApplicationSecretPublic>;
+  remove(key: ApplicationSecretKey): Promise<ApplicationSecretPublic>;
+  resolve(key: ApplicationSecretKey): Promise<string | null>;
+}
+
+function assertApplicationSecretKey(
+  value: string,
+): asserts value is ApplicationSecretKey {
+  if (!isApplicationSecretKey(value)) {
+    throw new Error("Unsupported application secret key");
+  }
+}
+
+function toUnconfigured(key: ApplicationSecretKey): ApplicationSecretPublic {
+  return {
+    key,
+    isConfigured: false,
+    createdAt: null,
+    updatedAt: null,
+  };
+}
+
+export class ApplicationSecretsService implements IApplicationSecretsService {
+  private readonly repository: ApplicationSecretsRepositoryPort;
+  private readonly encryptionKey: Buffer | undefined;
+
+  constructor(options: ApplicationSecretsServiceOptions = {}) {
+    this.repository =
+      options.repository ??
+      new ApplicationSecretsRepository(
+        options.db ??
+          (() => {
+            throw new Error(
+              "ApplicationSecretsService requires db or repository",
+            );
+          })(),
+      );
+    this.encryptionKey = options.encryptionKey;
+  }
+
+  async list(): Promise<ApplicationSecretPublic[]> {
+    return Promise.all(
+      APPLICATION_SECRET_KEYS.map(async (key) => {
+        const row = await this.repository.findByKey(key);
+        return row
+          ? {
+              key,
+              isConfigured: true,
+              createdAt: row.createdAt,
+              updatedAt: row.updatedAt,
+            }
+          : toUnconfigured(key);
+      }),
+    );
+  }
+
+  async replace(
+    key: ApplicationSecretKey,
+    plaintext: string,
+  ): Promise<ApplicationSecretPublic> {
+    assertApplicationSecretKey(key);
+    if (!plaintext.trim()) {
+      throw new Error("Application secret must be a non-empty string");
+    }
+
+    const record = await this.repository.upsert({
+      key,
+      credentialEnvelope: encryptProviderSecret(
+        plaintext,
+        this.getEncryptionKey(),
+      ),
+    });
+    return {
+      key: record.key,
+      isConfigured: true,
+      createdAt: record.createdAt,
+      updatedAt: record.updatedAt,
+    };
+  }
+
+  async remove(key: ApplicationSecretKey): Promise<ApplicationSecretPublic> {
+    assertApplicationSecretKey(key);
+    await this.repository.deleteByKey(key);
+    return toUnconfigured(key);
+  }
+
+  async resolve(key: ApplicationSecretKey): Promise<string | null> {
+    assertApplicationSecretKey(key);
+    const record = await this.repository.findByKey(key);
+    if (!record) {
+      return null;
+    }
+
+    try {
+      return resolveProviderCredential(
+        { credentialEnvelope: record.credentialEnvelope },
+        this.getEncryptionKey(),
+      );
+    } catch {
+      return null;
+    }
+  }
+
+  private getEncryptionKey(): Buffer {
+    return this.encryptionKey ?? parseProviderEncryptionKey();
+  }
+}

diff --git a/services/llm-config-service/src/services/__tests__/application-secrets.service.test.ts b/services/llm-config-service/src/services/__tests__/application-secrets.service.test.ts
new file mode 100644
index 00000000..dce123a3
--- /dev/null
+++ b/services/llm-config-service/src/services/__tests__/application-secrets.service.test.ts
@@ -0,0 +1,173 @@
+import { describe, expect, it } from "vitest";
+import { encryptProviderSecret } from "../../lib/provider-secrets.js";
+import { ApplicationSecretsRepository } from "../../repositories/application-secrets-repository.js";
+import {
+  type ApplicationSecretsRepositoryPort,
+  ApplicationSecretsService,
+} from "../application-secrets.service.js";
+
+const encryptionKey = Buffer.alloc(32, 7);
+
+function createRepository(): ApplicationSecretsRepositoryPort {
+  const rows = new Map<
+    string,
+    {
+      key: "artificial_analysis_api_key" | "openrouter_api_key";
+      credentialEnvelope: string;
+      createdAt: Date;
+      updatedAt: Date;
+    }
+  >();
+
+  return {
+    async findByKey(key) {
+      return rows.get(key) ?? null;
+    },
+    async upsert(input) {
+      const existing = rows.get(input.key);
+      const now = new Date();
+      const row = {
+        key: input.key,
+        credentialEnvelope: input.credentialEnvelope,
+        createdAt: existing?.createdAt ?? now,
+        updatedAt: now,
+      };
+      rows.set(input.key, row);
+      return row;
+    },
+    async deleteByKey(key) {
+      return rows.delete(key);
+    },
+  };
+}
+
+describe("ApplicationSecretsService", () => {
+  it("encrypts a replacement and returns public metadata only", async () => {
+    let persistedEnvelope: string | undefined;
+    const repository = createRepository();
+    const upsert = repository.upsert.bind(repository);
+    repository.upsert = async (input) => {
+      persistedEnvelope = input.credentialEnvelope;
+      return upsert(input);
+    };
+    const service = new ApplicationSecretsService({
+      repository,
+      encryptionKey,
+    });
+
+    const result = await service.replace(
+      "artificial_analysis_api_key",
+      "aa-live-secret",
+    );
+
+    expect(result).toEqual({
+      key: "artificial_analysis_api_key",
+      isConfigured: true,
+      createdAt: expect.any(Date),
+      updatedAt: expect.any(Date),
+    });
+    expect(JSON.stringify(result)).not.toContain("aa-live-secret");
+    expect(persistedEnvelope).toMatch(/^enc:v1:/);
+    expect(persistedEnvelope).not.toContain("aa-live-secret");
+    expect(await service.resolve("artificial_analysis_api_key")).toBe(
+      "aa-live-secret",
+    );
+  });
+
+  it("lists both allowlisted keys without exposing stored values", async () => {
+    const service = new ApplicationSecretsService({
+      repository: createRepository(),
+      encryptionKey,
+    });
+    await service.replace("openrouter_api_key", "or-live-secret");
+
+    expect(await service.list()).toEqual([
+      {
+        key: "artificial_analysis_api_key",
+        isConfigured: false,
+        createdAt: null,
+        updatedAt: null,
+      },
+      {
+        key: "openrouter_api_key",
+        isConfigured: true,
+        createdAt: expect.any(Date),
+        updatedAt: expect.any(Date),
+      },
+    ]);
+  });
+
+  it("rejects non-allowlisted and blank values", async () => {
+    const service = new ApplicationSecretsService({
+      repository: createRepository(),
+      encryptionKey,
+    });
+
+    await expect(
+      service.replace("unexpected_key" as never, "value"),
+    ).rejects.toThrow(/unsupported/i);
+    await expect(service.replace("openrouter_api_key", "   ")).rejects.toThrow(
+      /non-empty/i,
+    );
+  });
+
+  it("rejects a non-allowlisted key at the repository write boundary", async () => {
+    const repository = new ApplicationSecretsRepository({
+      insert: () => {
+        throw new Error("the database write must not be reached");
+      },
+    } as never);
+
+    await expect(
+      repository.upsert({
+        key: "unexpected_key" as never,
+        credentialEnvelope: "enc:v1:invalid",
+      }),
+    ).rejects.toThrow(/unsupported/i);
+  });
+
+  it("fails closed for missing, malformed, or undecryptable persisted values", async () => {
+    const repository = createRepository();
+    const service = new ApplicationSecretsService({
+      repository,
+      encryptionKey,
+    });
+
+    expect(await service.resolve("openrouter_api_key")).toBeNull();
+    await repository.upsert({
+      key: "openrouter_api_key",
+      credentialEnvelope: "not-an-envelope",
+    });
+    expect(await service.resolve("openrouter_api_key")).toBeNull();
+    await repository.upsert({
+      key: "openrouter_api_key",
+      credentialEnvelope: encryptProviderSecret(
+        "encrypted-with-another-key",
+        Buffer.alloc(32, 9),
+      ),
+    });
+    expect(await service.resolve("openrouter_api_key")).toBeNull();
+  });
+
+  it("removes idempotently and returns only unconfigured public metadata", async () => {
+    const service = new ApplicationSecretsService({
+      repository: createRepository(),
+      encryptionKey,
+    });
+
+    await service.replace("openrouter_api_key", "or-live-secret");
+
+    await expect(service.remove("openrouter_api_key")).resolves.toEqual({
+      key: "openrouter_api_key",
+      isConfigured: false,
+      createdAt: null,
+      updatedAt: null,
+    });
+    await expect(service.remove("openrouter_api_key")).resolves.toEqual({
+      key: "openrouter_api_key",
+      isConfigured: false,
+      createdAt: null,
+      updatedAt: null,
+    });
+  });
+});

```
