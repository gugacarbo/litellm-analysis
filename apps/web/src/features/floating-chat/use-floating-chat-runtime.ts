import {
  AssistantChatTransport,
  useChatRuntime,
} from "@assistant-ui/react-ai-sdk";
import { useMemo } from "react";

export function useFloatingChatRuntime(selectedModel: string) {
  const transport = useMemo(
    () =>
      new AssistantChatTransport({
        api: "/api/chat",
        body: {
          config: {
            modelName: selectedModel,
          },
        },
      }),
    [selectedModel],
  );

  return useChatRuntime({ transport });
}
