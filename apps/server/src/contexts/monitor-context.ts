import type { MonitorDb } from "@lite-llm/monitor";
import { getMonitorDb } from "@lite-llm/monitor";

export interface MonitorProvider {
  monitorDb: MonitorDb;
}

export function createMonitorProvider(): MonitorProvider {
  const monitorDb = getMonitorDb();
  return { monitorDb };
}
