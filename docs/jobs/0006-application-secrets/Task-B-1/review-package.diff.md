# Review package

- Task: Task-B-1
- Base commit: c22e434a3fb31b00a29c961681a23d3575343115
- Head: HEAD (c22e434a3fb31b00a29c961681a23d3575343115; task changes are intentionally uncommitted during this execution phase)
- Source: task-owned working-tree diff against the recorded base

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

```
