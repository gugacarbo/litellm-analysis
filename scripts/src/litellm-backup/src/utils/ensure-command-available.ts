import { execSync } from "node:child_process";

export function ensureCommandAvailable(command: string): void {
  try {
    execSync(`command -v ${command}`, { stdio: "ignore" });
  } catch {
    throw new Error(`${command} not found in PATH. Install it and try again.`);
  }
}
