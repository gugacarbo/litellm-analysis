import { escapeRegExp } from "./escape-regexp";

export function buildBackupPattern(dbName: string): RegExp {
  return new RegExp(
    `^litellm_${escapeRegExp(dbName)}_\\d{8}_\\d{6}\\.(sql\\.gz|dump|dir\\.tar\\.gz|dir\\.tar)$`,
  );
}
