import * as fs from 'node:fs';
import * as path from 'node:path';
import type { DbConfig, FilePaths } from '../types/index.js';

// ── FileStorage: Single Responsibility for I/O ──

export interface IFileStorage {
  read(): Promise<DbConfig>;
  write(config: DbConfig): Promise<void>;
  ensureDir(): Promise<void>;
  getPaths(): FilePaths;
}

export class FileStorage implements IFileStorage {
  private readonly paths: FilePaths;
  private readonly projectRoot: string;

  constructor(customPaths?: Partial<FilePaths>) {
    const configDir = customPaths?.configDir ?? 'data';
    this.projectRoot = path.resolve(process.cwd());
    this.paths = {
      configDir: path.join(this.projectRoot, configDir),
      dbFile: path.join(this.projectRoot, customPaths?.dbFile ?? 'data/db.json'),
      legacyConfigFile: path.join(this.projectRoot, customPaths?.legacyConfigFile ?? 'data/oh-my-openagent.json'),
      providersFile: path.join(this.projectRoot, customPaths?.providersFile ?? 'data/opencode.json'),
      vscodeModelsFile: path.join(this.projectRoot, customPaths?.vscodeModelsFile ?? 'data/vscode-oaicopilot.json'),
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
      const content = await fs.promises.readFile(this.paths.dbFile, 'utf-8');
      return JSON.parse(content) as DbConfig;
    } catch (error: unknown) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
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
      'utf-8',
    );
    await fs.promises.rename(tmpPath, this.paths.dbFile);
  }

  private getDefaultConfig(): DbConfig {
    return {
      version: 1,
      litellm: {
        baseUrl: 'http://localhost:4000/v1',
        apiKey: 'sk-123456789',
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
