import { useEffect, useMemo, useRef } from "react";
import { ReadonlyInteractionThread } from "@/shared/components/automatic-interactions/readonly-interaction-thread";
import type { ProxyRequestLog } from "@/shared/lib/api-client/spend";
import { normalizeSpendLogThread } from "@/shared/lib/automatic-interactions/normalize-spend-log-thread";
import { resolveSpendLogRawPayload } from "@/shared/lib/automatic-interactions/resolve-spend-log-raw-payload";

type ChatSimulationProps = {
  log: ProxyRequestLog;
};

export function ChatSimulation({ log }: ChatSimulationProps) {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const thread = useMemo(() => normalizeSpendLogThread(log), [log]);
  const resolveRawPayload = useMemo(
    () => (ref: string) => resolveSpendLogRawPayload(log, ref),
    [log],
  );

  useEffect(() => {
    const element = scrollContainerRef.current;
    if (!element) return;

    const rafId = requestAnimationFrame(() => {
      element.scrollTop = element.scrollHeight;
    });

    return () => cancelAnimationFrame(rafId);
  });

  return (
    <div className="rounded-lg border bg-muted/10 p-2">
      <div
        ref={scrollContainerRef}
        className="h-[460px] max-h-[70vh] overflow-y-auto overflow-x-hidden rounded-md bg-background/60"
      >
        <ReadonlyInteractionThread
          thread={thread}
          resolveRawPayload={resolveRawPayload}
          className="px-2 py-3"
        />
      </div>
    </div>
  );
}
