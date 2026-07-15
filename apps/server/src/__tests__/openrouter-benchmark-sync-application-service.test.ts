import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  OpenRouterBenchmarkSyncApplicationService,
  OpenRouterBenchmarkSyncConfigurationError,
} from "../application/openrouter-benchmark-sync-application-service";

let tempRoot: string;

beforeEach(async () => {
  tempRoot = await mkdtemp(
    path.join(os.tmpdir(), "openrouter-benchmark-sync-"),
  );
});

afterEach(async () => {
  await rm(tempRoot, { recursive: true, force: true });
});

function createService(
  runner: ConstructorParameters<
    typeof OpenRouterBenchmarkSyncApplicationService
  >[0]["runner"],
  resolveApiKey = vi.fn().mockResolvedValue("openrouter-key"),
) {
  const outputDir = path.join(tempRoot, "benchmarks");
  return new OpenRouterBenchmarkSyncApplicationService({
    outputDir,
    datasetFilePath: path.join(outputDir, "openrouter-benchmarks.json"),
    resolveApiKey,
    runner,
  });
}

describe("OpenRouterBenchmarkSyncApplicationService", () => {
  it("resolves the key at every trigger", async () => {
    const resolveApiKey = vi
      .fn<() => Promise<string | null>>()
      .mockResolvedValueOnce("first-openrouter-key")
      .mockResolvedValueOnce("second-openrouter-key");
    const runner = vi.fn().mockResolvedValue(undefined);
    const service = createService(runner, resolveApiKey);

    await service.start();
    await vi.waitFor(() => {
      expect(service.getStatus().status).toBe("succeeded");
    });
    await vi.waitFor(() => {
      expect(service.getStatus().canTrigger).toBe(true);
    });
    await service.start();

    expect(resolveApiKey).toHaveBeenCalledTimes(2);
    expect(runner).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ apiKey: "first-openrouter-key" }),
    );
    expect(runner).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ apiKey: "second-openrouter-key" }),
    );
  });

  it("treats missing or unreadable values as configuration errors", async () => {
    const runner = vi.fn();
    const service = createService(
      runner,
      vi.fn().mockRejectedValue(new Error("corrupt envelope")),
    );

    await expect(service.start()).rejects.toThrow(
      OpenRouterBenchmarkSyncConfigurationError,
    );
    expect(runner).not.toHaveBeenCalled();
    expect(service.getStatus().lastError).toBe(
      "OPENROUTER_API_KEY is not configured",
    );
  });

  it("redacts a resolved key echoed by the runner", async () => {
    const secret = "openrouter-secret-that-must-not-leak";
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
});
