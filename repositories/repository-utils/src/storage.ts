import * as fs from "node:fs/promises";
import * as path from "node:path";

export interface IStorage {
  read(filePath: string): Promise<string>;
  write(filePath: string, content: string): Promise<void>;
  exists(filePath: string): Promise<boolean>;
}

export class FileStorage implements IStorage {
  async read(filePath: string): Promise<string> {
    return fs.readFile(filePath, "utf-8");
  }

  async write(filePath: string, content: string): Promise<void> {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    const tmpPath = `${filePath}.tmp`;
    await fs.writeFile(tmpPath, content, "utf-8");
    await fs.rename(tmpPath, filePath);
  }

  async exists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

export class MemoryStorage implements IStorage {
  private files: Record<string, string>;

  constructor(files: Record<string, string> = {}) {
    this.files = { ...files };
  }

  async read(filePath: string): Promise<string> {
    if (this.files[filePath] === undefined) {
      throw new Error(`ENOENT: no such file '${filePath}'`);
    }
    return this.files[filePath];
  }

  async write(filePath: string, content: string): Promise<void> {
    this.files[filePath] = content;
  }

  async exists(filePath: string): Promise<boolean> {
    return this.files[filePath] !== undefined;
  }
}
