import { mkdirSync } from "node:fs";
import { getRequiredConfig } from "../config/get-required-config";
import type { BackupContext } from "../types/backup";
import { ensureCommandAvailable } from "../utils/ensure-command-available";

export function validateEnvironmentTask(ctx: BackupContext): void {
  const config = getRequiredConfig(ctx);

  ensureCommandAvailable("docker");
  mkdirSync(config.backupDir, { recursive: true });
}
