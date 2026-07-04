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
    workspaceRoot: tempRoot,
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

  it("passes server env and output dir to the runner", async () => {
    const runner = vi.fn().mockResolvedValue(undefined);
    const service = createService(runner, "server-aa-key");

    service.start();
    await vi.waitFor(() => {
      expect(service.getStatus().status).toBe("succeeded");
    });

    expect(runner).toHaveBeenCalledWith(
      expect.objectContaining({
        workspaceRoot: tempRoot,
        outputDir: path.join(tempRoot, "benchmarks"),
        env: expect.objectContaining({
          ARTIFICIAL_ANALYSIS_API_KEY: "server-aa-key",
          OUTPUT_DIR: path.join(tempRoot, "benchmarks"),
        }),
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
