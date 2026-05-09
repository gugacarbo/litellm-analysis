import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import * as process from "node:process";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createRepositoryClient } from "./client.js";

describe("createRepositoryClient fallback", () => {
  let tmpDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    originalCwd = process.cwd();
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "agents-manager-test-"));
    await fs.writeFile(path.join(tmpDir, "pnpm-workspace.yaml"), "\n");
    await fs.mkdir(path.join(tmpDir, "@settings"), { recursive: true });
    process.chdir(tmpDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("uses .jsonc when .json is missing", async () => {
    const jsoncPath = path.join(tmpDir, "@settings", "agents.jsonc");
    await fs.writeFile(jsoncPath, "{}");

    const repository = createRepositoryClient();
    expect(repository.getPath()).toBe(jsoncPath);
  });

  it("prefers .json when both files exist", async () => {
    const jsonPath = path.join(tmpDir, "@settings", "agents.json");
    const jsoncPath = path.join(tmpDir, "@settings", "agents.jsonc");
    await fs.writeFile(jsonPath, "{}");
    await fs.writeFile(jsoncPath, "{}");

    const repository = createRepositoryClient();
    expect(repository.getPath()).toBe(jsonPath);
  });
});
