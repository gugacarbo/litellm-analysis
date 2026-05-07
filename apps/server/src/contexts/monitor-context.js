import { getMonitorDb } from "@lite-llm/monitor";
export function createMonitorProvider() {
  const monitorDb = getMonitorDb();
  return { monitorDb };
}
