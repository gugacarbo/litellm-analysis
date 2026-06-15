"use client";

import {
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
} from "@assistant-ui/react";
import { type FC, useCallback, useEffect, useMemo, useState } from "react";
import { Thread } from "@/shared/components/assistant-ui/thread";
import { mapNormalizedThreadToThreadMessages } from "@/shared/lib/automatic-interactions/map-normalized-thread-messages";
import { cn } from "@/shared/lib/utils";
import type { NormalizedThread } from "@/shared/types/automatic-interaction-thread";

export type LiveHealthCheckThreadProps = {
  executionId: string;
  initialThread: NormalizedThread;
  onDelta?: (appendDelta: (delta: string) => void) => void;
  className?: string;
};

const noopOnNew = async () => {};

function LiveHealthCheckThreadRuntime({
  thread,
  className,
}: {
  thread: NormalizedThread;
  className?: string;
}) {
  const messages = useMemo(
    () => mapNormalizedThreadToThreadMessages(thread),
    [thread],
  );

  const runtime = useExternalStoreRuntime({
    messages,
    isRunning: thread.isRunning ?? false,
    isDisabled: true,
    onNew: noopOnNew,
  });

  if (messages.length === 0) {
    return (
      <div
        className={cn(
          "flex h-48 items-center justify-center text-sm text-muted-foreground",
          className,
        )}
      >
        No messages available
      </div>
    );
  }

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div
        className={cn(
          "aui-live-health-check-thread h-full min-h-0",
          "[&_.aui-composer-root]:hidden",
          "[&_.aui-thread-welcome-root]:hidden",
          "[&_.aui-thread-welcome-suggestions]:hidden",
          className,
        )}
      >
        <Thread />
      </div>
    </AssistantRuntimeProvider>
  );
}

export const LiveHealthCheckThread: FC<LiveHealthCheckThreadProps> = ({
  executionId,
  initialThread,
  onDelta,
  className,
}) => {
  const [thread, setThread] = useState<NormalizedThread>(initialThread);

  useEffect(() => {
    setThread(initialThread);
  }, [initialThread]);

  const appendDelta = useCallback((delta: string) => {
    setThread((current) => ({
      ...current,
      isRunning: true,
      partialAssistantText: `${current.partialAssistantText ?? ""}${delta}`,
    }));
  }, []);

  useEffect(() => {
    onDelta?.(appendDelta);
  }, [appendDelta, onDelta]);

  return (
    <LiveHealthCheckThreadRuntime
      key={executionId}
      thread={thread}
      className={className}
    />
  );
};
