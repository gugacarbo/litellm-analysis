import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  BenchmarkSyncApplicationService,
  BenchmarkSyncConfigurationError,
} from "../application/benchmark-sync-application-service";

let tempRoot: string;

beforeEach(async () => {
  tempRoot = await mkdtemp(path.join(os.tmpdir(), "benchmark-sync-"));
});

afterEach(async () => {
  await rm(tempRoot, { recursive: true, force: true });
});

function createService(
  runner: ConstructorParameters<
    typeof BenchmarkSyncApplicationService
  >[0]["runner"],
  apiKey = "aa-key",
) {
  const outputDir = path.join(tempRoot, "benchmarks");
  return new BenchmarkSyncApplicationService({
    outputDir,
    datasetFilePath: path.join(outputDir, "artificial-analysis-models.json"),
    artificialAnalysisApiKey: apiKey,
    runner,
  });
}

describe("BenchmarkSyncApplicationService", () => {
  it("starts a background run and dedupes concurrent triggers", async () => {
    let resolveRun!: () => void;
    const runner = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveRun = resolve;
        }),
    );
    const service = createService(runner);

    const started = service.start();
    const duplicate = service.start();

    expect(started.triggered).toBe(true);
    expect(started.status).toBe("running");
    expect(duplicate.triggered).toBe(false);
    expect(duplicate.status).toBe("running");
    expect(runner).toHaveBeenCalledOnce();

    resolveRun();
    await vi.waitFor(() => {
      expect(service.getStatus().status).toBe("succeeded");
    });
  });

  it("blocks a new sync for one hour after a successful sync", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-06T18:00:00.000Z"));

    try {
      const service = createService(vi.fn().mockResolvedValue(undefined));

      service.start();
      await vi.waitFor(() => {
        expect(service.getStatus().status).toBe("succeeded");
      });

      const immediateRetry = service.start();
      expect(immediateRetry.triggered).toBe(false);
      expect(immediateRetry.canTrigger).toBe(false);
      expect(immediateRetry.cooldownUntil).not.toBeNull();
      expect(Date.parse(immediateRetry.cooldownUntil ?? "")).toBeGreaterThan(
        Date.parse("2026-07-06T18:59:59.000Z"),
      );
      expect(Date.parse(immediateRetry.cooldownUntil ?? "")).toBeLessThan(
        Date.parse("2026-07-06T19:00:01.000Z"),
      );

      vi.setSystemTime(new Date("2026-07-06T19:00:01.000Z"));

      const retryAfterCooldown = service.start();
      expect(retryAfterCooldown.triggered).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("passes api key and output dir to the runner", async () => {
    const runner = vi.fn().mockResolvedValue(undefined);
    const service = createService(runner, "server-aa-key");

    service.start();
    await vi.waitFor(() => {
      expect(service.getStatus().status).toBe("succeeded");
    });

    expect(runner).toHaveBeenCalledWith(
      expect.objectContaining({
        apiKey: "server-aa-key",
        outputDir: path.join(tempRoot, "benchmarks"),
      }),
    );
  });

  it("records failure state when the runner rejects", async () => {
    const service = createService(
      vi.fn().mockRejectedValue(new Error("AA unavailable")),
    );

    service.start();

    await vi.waitFor(() => {
      const status = service.getStatus();
      expect(status.status).toBe("failed");
      expect(status.lastError).toContain("AA unavailable");
    });
  });

  it("throws a configuration error when the AA api key is missing", () => {
    const service = createService(vi.fn(), "");

    expect(() => service.start()).toThrow(BenchmarkSyncConfigurationError);
    expect(service.getStatus()).toMatchObject({
      status: "failed",
      lastError: "ARTIFICIAL_ANALYSIS_API_KEY is not configured",
    });
  });

  it("reports whether the local dataset exists", async () => {
    const outputDir = path.join(tempRoot, "benchmarks");
    await mkdir(outputDir, { recursive: true });
    await writeFile(
      path.join(outputDir, "artificial-analysis-models.json"),
      "{}",
      "utf8",
    );

    const service = createService(vi.fn().mockResolvedValue(undefined));

    expect(service.getStatus().datasetExists).toBe(true);
  });
});
