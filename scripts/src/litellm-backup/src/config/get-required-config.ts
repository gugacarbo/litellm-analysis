import type { BackupConfig, BackupContext } from "../types/backup";

export function getRequiredConfig(ctx: BackupContext): BackupConfig {
  if (!ctx.config) {
    throw new Error("Backup configuration was not initialized");
  }

  return ctx.config;
}
