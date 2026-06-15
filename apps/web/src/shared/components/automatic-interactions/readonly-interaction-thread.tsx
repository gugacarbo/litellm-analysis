"use client";

import {
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
} from "@assistant-ui/react";
import { type FC, useMemo } from "react";
import { Thread } from "@/shared/components/assistant-ui/thread";
import { createRawPayloadThreadComponents } from "@/shared/components/automatic-interactions/raw-payload-thread-components";
import { mapNormalizedThreadToThreadMessages } from "@/shared/lib/automatic-interactions/map-normalized-thread-messages";
import { cn } from "@/shared/lib/utils";
import type { NormalizedThread } from "@/shared/types/automatic-interaction-thread";

const noopOnNew = async () => {};

export type ReadonlyInteractionThreadProps = {
  thread: NormalizedThread;
  className?: string;
  resolveRawPayload?: (ref: string) => unknown;
};

export const ReadonlyInteractionThread: FC<ReadonlyInteractionThreadProps> = ({
  thread,
  className,
  resolveRawPayload,
}) => {
  const messages = useMemo(
    () => mapNormalizedThreadToThreadMessages(thread),
    [thread],
  );

  const threadComponents = useMemo(
    () =>
      resolveRawPayload
        ? createRawPayloadThreadComponents(resolveRawPayload)
        : undefined,
    [resolveRawPayload],
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
          "aui-readonly-interaction-thread h-full min-h-0",
          "[&_.aui-composer-root]:hidden",
          "[&_.aui-thread-welcome-root]:hidden",
          "[&_.aui-thread-welcome-suggestions]:hidden",
          "[&_.aui-assistant-action-bar-root]:hidden",
          "[&_.aui-user-action-bar-root]:hidden",
          "[&_.aui-branch-picker-root]:hidden",
          className,
        )}
      >
        <Thread components={threadComponents} />
      </div>
    </AssistantRuntimeProvider>
  );
};
