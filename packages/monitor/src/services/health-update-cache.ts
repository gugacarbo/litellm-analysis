import type { ModelHealthUpdate } from "./monitor-types";

/**
 * Singleton cache for the latest model health update from MonitorService.
 *
 * The MonitorService emits health_update events via WebSocket with full stats
 * (latency, throughput, request counts). The REST /models/health endpoint
 * previously derived health from active alerts only, losing the rich stats.
 *
 * This cache bridges that gap: MonitorService writes on each tick, and the
 * REST endpoint reads from this cache to serve full health data.
 */
class HealthUpdateCache {
  private static instance: HealthUpdateCache | null = null;

  private data: ModelHealthUpdate[] | null = null;
  private lastUpdateTs = 0;
  private readonly ttlMs: number;

  constructor(ttlMs = 30_000) {
    this.ttlMs = ttlMs;
  }

  static getInstance(ttlMs?: number): HealthUpdateCache {
    if (!HealthUpdateCache.instance) {
      HealthUpdateCache.instance = new HealthUpdateCache(ttlMs);
    }
    return HealthUpdateCache.instance;
  }

  update(models: ModelHealthUpdate[]): void {
    this.data = models;
    this.lastUpdateTs = Date.now();
  }

  getLatest(): ModelHealthUpdate[] | null {
    if (this.isStale()) {
      return null;
    }
    return this.data;
  }

  isStale(): boolean {
    if (this.data === null) return true;
    return Date.now() - this.lastUpdateTs > this.ttlMs;
  }

  get lastUpdatedAt(): number {
    return this.lastUpdateTs;
  }
}

export function getHealthUpdateCache(): HealthUpdateCache {
  return HealthUpdateCache.getInstance();
}

export type { HealthUpdateCache };
