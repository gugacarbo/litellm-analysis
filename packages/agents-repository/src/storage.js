import * as fs from "node:fs/promises";
import * as path from "node:path";
export class FileStorage {
  async read(filePath) {
    return fs.readFile(filePath, "utf-8");
  }
  async write(filePath, content) {
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    const tmpPath = `${filePath}.tmp`;
    await fs.writeFile(tmpPath, content, "utf-8");
    await fs.rename(tmpPath, filePath);
  }
  async exists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}
