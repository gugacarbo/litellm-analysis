import { type AppDb, getAppDb } from "@lite-llm/app-repository/client";

// Backward-compatible aliases
export const getMonitorDb = getAppDb;
export type MonitorDb = AppDb;
