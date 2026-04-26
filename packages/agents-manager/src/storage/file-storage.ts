import * as fs from "node:fs";
import * as path from "node:path";
import type { DbConfig, FilePaths } from "../types/index.js";

// ── FileStorage: Single Responsibility for I/O ──

export interface IFileStorage {
  read(): Promise<DbConfig>;
  write(config: DbConfig): Promise<void>;
  ensureDir(): Promise<void>;
  getPaths(): FilePaths;
}

// Helper to resolve paths - uses custom path if absolute, otherwise joins with projectRoot
function resolveFilePath(projectRoot: string, customPath?: string, defaultPath?: string): string {
  const target = customPath ?? defaultPath ?? "db";
  if (path.isAbsolute(target)) {
    return target;
  }
  return path.resolve(projectRoot, target);
}

export class FileStorage implements IFileStorage {
  private readonly paths: FilePaths;

  constructor(customPaths?: Partial<FilePaths>) {
    // Use provided paths directly if absolute, otherwise resolve relative to project root
    const dbFile = resolveFilePath(process.cwd(), customPaths?.dbFile, "db/db.json");
    
    this.paths = {
      // configDir is derived from dbFile's directory
      configDir: path.dirname(dbFile),
      dbFile,
      legacyConfigFile: resolveFilePath(process.cwd(), customPaths?.legacyConfigFile, "data/oh-my-openagent.json"),
      providersFile: resolveFilePath(process.cwd(), customPaths?.providersFile, "data/opencode.json"),
      vscodeModelsFile: resolveFilePath(process.cwd(), customPaths?.vscodeModelsFile, "data/vscode-oaicopilot.json"),
    };
  }

  getPaths(): FilePaths {
    return this.paths;
  }

  async ensureDir(): Promise<void> {
    await fs.promises.mkdir(this.paths.configDir, { recursive: true });
  }

  async read(): Promise<DbConfig> {
    try {
      const content = await fs.promises.readFile(this.paths.dbFile, "utf-8");
      return JSON.parse(content) as DbConfig;
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return this.getDefaultConfig();
      }
      throw new Error(`Failed to read db file: ${(error as Error).message}`);
    }
  }

  async write(config: DbConfig): Promise<void> {
    await this.ensureDir();
    const tmpPath = `${this.paths.dbFile}.tmp`;
    await fs.promises.writeFile(
      tmpPath,
      JSON.stringify(config, null, 2),
      "utf-8",
    );
    await fs.promises.rename(tmpPath, this.paths.dbFile);
  }

  private getDefaultConfig(): DbConfig {
    return {
      version: 1,
      litellm: {
        baseUrl: "http://localhost:4000/v1",
        apiKey: "sk-123456789",
      },
      models: {},
      agents: {},
      categories: {},
    };
  }
}

// ── Factory ──

export function createFileStorage(paths?: Partial<FilePaths>): FileStorage {
  return new FileStorage(paths);
}
