"use client";

import { useAuiState } from "@assistant-ui/react";
import { type FC, type ReactNode, useState } from "react";
import {
  AssistantMessage,
  type ThreadComponents,
  UserMessage,
} from "@/shared/components/assistant-ui/thread";

function useMessageRawPayload(resolveRawPayload?: (ref: string) => unknown): {
  payload: unknown | undefined;
} {
  const rawPayloadRef = useAuiState((state) => {
    const custom = state.message.metadata?.custom;
    if (custom == null || typeof custom !== "object") return undefined;
    const ref = (custom as Record<string, unknown>).rawPayloadRef;
    return typeof ref === "string" ? ref : undefined;
  });

  const payload =
    rawPayloadRef && resolveRawPayload
      ? resolveRawPayload(rawPayloadRef)
      : undefined;

  return { payload };
}

function RawPayloadShell({
  children,
  resolveRawPayload,
}: {
  children: ReactNode;
  resolveRawPayload?: (ref: string) => unknown;
}) {
  const { payload } = useMessageRawPayload(resolveRawPayload);
  const [showRaw, setShowRaw] = useState(false);

  if (payload === undefined) {
    return <>{children}</>;
  }

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => setShowRaw((previous) => !previous)}
        className="rounded border border-border/70 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground hover:text-foreground"
      >
        {showRaw ? "Render" : "Raw"}
      </button>
      {showRaw ? (
        <pre className="overflow-x-auto rounded-md bg-muted/50 p-3 font-mono text-xs whitespace-pre-wrap">
          {JSON.stringify(payload, null, 2)}
        </pre>
      ) : (
        children
      )}
    </div>
  );
}

export function createRawPayloadThreadComponents(
  resolveRawPayload?: (ref: string) => unknown,
): ThreadComponents {
  const AssistantMessageWithRaw: FC = () => (
    <RawPayloadShell resolveRawPayload={resolveRawPayload}>
      <AssistantMessage />
    </RawPayloadShell>
  );

  const UserMessageWithRaw: FC = () => (
    <RawPayloadShell resolveRawPayload={resolveRawPayload}>
      <UserMessage />
    </RawPayloadShell>
  );

  return {
    AssistantMessage: AssistantMessageWithRaw,
    UserMessage: UserMessageWithRaw,
  };
}
