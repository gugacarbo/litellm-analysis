import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import * as process from "node:process";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { createRepositoryClient } from "./client";

describe("createRepositoryClient fallback", () => {
  let tmpDir: string;
  let originalCwd: string;

  beforeEach(async () => {
    originalCwd = process.cwd();
    tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "agents-manager-test-"));
    await fs.writeFile(path.join(tmpDir, "pnpm-workspace.yaml"), "\n");
    await fs.mkdir(path.join(tmpDir, "@agents"), { recursive: true });
    process.chdir(tmpDir);
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it("uses .jsonc when .json is missing", async () => {
    const jsoncPath = path.join(tmpDir, "@agents", "agents.jsonc");
    await fs.writeFile(jsoncPath, "{}");

    const repository = createRepositoryClient();
    expect(repository.getPath()).toBe(jsoncPath);
  });

  it("prefers .json when both files exist", async () => {
    const jsonPath = path.join(tmpDir, "@agents", "agents.json");
    const jsoncPath = path.join(tmpDir, "@agents", "agents.jsonc");
    await fs.writeFile(jsonPath, "{}");
    await fs.writeFile(jsoncPath, "{}");

    const repository = createRepositoryClient();
    expect(repository.getPath()).toBe(jsonPath);
  });

  it("copies agents.default.json when config file is missing", async () => {
    const jsonPath = path.join(tmpDir, "@agents", "agents.json");
    const defaultPath = path.join(tmpDir, "@agents", "agents.default.json");
    await fs.writeFile(defaultPath, '{"$schema":"./agents.schema.json"}');

    const repository = createRepositoryClient();
    expect(repository.getPath()).toBe(jsonPath);

    const created = await fs.readFile(jsonPath, "utf-8");
    expect(created).toContain('"$schema":"./agents.schema.json"');
  });
});
