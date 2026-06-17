import type { ProxyRequestLog } from "@lite-llm/analytics-service/types";
import type { SpendLogsChangedPayload } from "@lite-llm/contracts";
import type { WebSocketServer } from "./websocket-server";

const DEFAULT_POLL_INTERVAL_MS = 4_000;
const DEFAULT_DEBOUNCE_MS = 500;
const DEFAULT_RECENT_LOGS_LIMIT = 50;

type SpendLogFingerprintSource = Pick<
  ProxyRequestLog,
  "id" | "status" | "started_at" | "finished_at"
>;

export function spendLogFingerprint(log: SpendLogFingerprintSource): string {
  const updatedAt = log.finished_at ?? log.started_at;
  return `${log.status}|${updatedAt}`;
}

export function buildSpendLogFingerprintMap(
  logs: SpendLogFingerprintSource[],
): Map<string, string> {
  const fingerprints = new Map<string, string>();
  for (const log of logs) {
    fingerprints.set(log.id, spendLogFingerprint(log));
  }
  return fingerprints;
}

export function diffSpendLogFingerprints(
  previous: Map<string, string>,
  current: Map<string, string>,
): Set<string> {
  const changedIds = new Set<string>();

  for (const [requestId, fingerprint] of current) {
    if (previous.get(requestId) !== fingerprint) {
      changedIds.add(requestId);
    }
  }

  return changedIds;
}

export interface SpendLogsWatcherOptions {
  analyticsDataSource: Pick<
    import("@lite-llm/analytics-service/data-source").AnalyticsDataSource,
    "getSpendLogs"
  >;
  wsServer: Pick<WebSocketServer, "broadcast">;
  pollIntervalMs?: number;
  debounceMs?: number;
  recentLogsLimit?: number;
}

export interface SpendLogsWatcher {
  start: () => void;
  stop: () => void;
  tick: () => Promise<void>;
}

export function createSpendLogsWatcher(
  options: SpendLogsWatcherOptions,
): SpendLogsWatcher {
  const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
  const debounceMs = options.debounceMs ?? DEFAULT_DEBOUNCE_MS;
  const recentLogsLimit = options.recentLogsLimit ?? DEFAULT_RECENT_LOGS_LIMIT;

  let previousFingerprints: Map<string, string> | null = null;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingChangedIds = new Set<string>();
  let ticking = false;

  const emitSpendLogsChanged = (changedRequestIds: string[]) => {
    const payload: SpendLogsChangedPayload = {
      changedRequestIds,
      timestamp: Date.now(),
    };
    options.wsServer.broadcast({
      type: "spend_logs_changed",
      data: payload,
    });
  };

  const flushPendingChanges = () => {
    debounceTimer = null;
    if (pendingChangedIds.size === 0) {
      return;
    }

    const changedRequestIds = [...pendingChangedIds];
    pendingChangedIds = new Set();
    emitSpendLogsChanged(changedRequestIds);
  };

  const scheduleBroadcast = (changedIds: Set<string>) => {
    for (const requestId of changedIds) {
      pendingChangedIds.add(requestId);
    }

    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(flushPendingChanges, debounceMs);
  };

  const tick = async () => {
    if (ticking) {
      return;
    }

    ticking = true;
    try {
      const { logs } = await options.analyticsDataSource.getSpendLogs({
        limit: recentLogsLimit,
        offset: 0,
      });
      const currentFingerprints = buildSpendLogFingerprintMap(logs);

      if (previousFingerprints !== null) {
        const changedIds = diffSpendLogFingerprints(
          previousFingerprints,
          currentFingerprints,
        );
        if (changedIds.size > 0) {
          scheduleBroadcast(changedIds);
        }
      }

      previousFingerprints = currentFingerprints;
    } finally {
      ticking = false;
    }
  };

  return {
    start() {
      if (pollTimer) {
        return;
      }

      void tick();
      pollTimer = setInterval(() => {
        void tick();
      }, pollIntervalMs);
    },
    stop() {
      if (pollTimer) {
        clearInterval(pollTimer);
        pollTimer = null;
      }

      if (debounceTimer) {
        clearTimeout(debounceTimer);
        debounceTimer = null;
      }

      pendingChangedIds.clear();
      previousFingerprints = null;
    },
    tick,
  };
}
