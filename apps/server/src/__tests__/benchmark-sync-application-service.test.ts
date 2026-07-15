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
  resolveApiKey = vi.fn().mockResolvedValue("aa-key"),
) {
  const outputDir = path.join(tempRoot, "benchmarks");
  return new BenchmarkSyncApplicationService({
    outputDir,
    datasetFilePath: path.join(outputDir, "artificial-analysis-models.json"),
    resolveApiKey,
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

    await expect(started).resolves.toMatchObject({
      triggered: true,
      status: "running",
    });
    await expect(duplicate).resolves.toMatchObject({
      triggered: false,
      status: "running",
    });
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

      await service.start();
      await vi.waitFor(() => {
        expect(service.getStatus().status).toBe("succeeded");
      });

      const immediateRetry = await service.start();
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

      const retryAfterCooldown = await service.start();
      expect(retryAfterCooldown.triggered).toBe(true);
    } finally {
      vi.useRealTimers();
    }
  });

  it("passes api key and output dir to the runner", async () => {
    const runner = vi.fn().mockResolvedValue(undefined);
    const service = createService(
      runner,
      vi.fn().mockResolvedValue("server-aa-key"),
    );

    await service.start();
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

    await service.start();

    await vi.waitFor(() => {
      const status = service.getStatus();
      expect(status.status).toBe("failed");
      expect(status.lastError).toContain("AA unavailable");
    });
  });

  it("throws a configuration error when the AA api key is missing", async () => {
    const service = createService(vi.fn(), vi.fn().mockResolvedValue(null));

    await expect(service.start()).rejects.toThrow(
      BenchmarkSyncConfigurationError,
    );
    expect(service.getStatus()).toMatchObject({
      status: "failed",
      lastError: "ARTIFICIAL_ANALYSIS_API_KEY is not configured",
    });
  });

  it("resolves the key for each trigger instead of retaining a startup value", async () => {
    const resolveApiKey = vi
      .fn<() => Promise<string | null>>()
      .mockResolvedValueOnce("first-aa-key")
      .mockResolvedValueOnce("second-aa-key");
    const runner = vi.fn().mockResolvedValue(undefined);
    const service = createService(runner, resolveApiKey);

    await service.start();
    await vi.waitFor(() => {
      expect(service.getStatus().status).toBe("succeeded");
    });
    await new Promise<void>((resolve) => setImmediate(resolve));

    vi.useFakeTimers();
    try {
      vi.setSystemTime(
        Date.parse(service.getStatus().lastSuccessAt ?? "") + 60 * 60_000 + 1,
      );
      await service.start();
    } finally {
      vi.useRealTimers();
    }

    expect(resolveApiKey).toHaveBeenCalledTimes(2);
    expect(runner).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ apiKey: "first-aa-key" }),
    );
    expect(runner).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ apiKey: "second-aa-key" }),
    );
  });

  it("treats an unreadable stored value as missing and never calls the runner", async () => {
    const runner = vi.fn();
    const service = createService(
      runner,
      vi.fn().mockRejectedValue(new Error("invalid envelope")),
    );

    await expect(service.start()).rejects.toThrow(
      BenchmarkSyncConfigurationError,
    );
    expect(runner).not.toHaveBeenCalled();
    expect(service.getStatus().lastError).toBe(
      "ARTIFICIAL_ANALYSIS_API_KEY is not configured",
    );
  });

  it("redacts a resolved key echoed by the runner", async () => {
    const secret = "aa-secret-that-must-not-leak";
    const service = createService(
      vi.fn().mockRejectedValue(new Error(`upstream rejected ${secret}`)),
      vi.fn().mockResolvedValue(secret),
    );

    await service.start();
    await vi.waitFor(() => {
      expect(service.getStatus().status).toBe("failed");
    });

    expect(service.getStatus().lastError).not.toContain(secret);
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
