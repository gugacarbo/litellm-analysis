// ── Migration Barrel ──
// Re-exports the v1 → v2 migration function and its result type.

export type { MigrationResult } from "./migrate-v1-to-v2.js";
export { migrateV1ToV2 } from "./migrate-v1-to-v2.js";
