import { AssistantRuntimeProvider } from "@assistant-ui/react";
import { BotIcon, Loader2 } from "lucide-react";
import { AssistantModal } from "@/shared/components/assistant-ui/assistant-modal";
import { TooltipIconButton } from "@/shared/components/assistant-ui/tooltip-icon-button";
import { cn } from "@/shared/lib/utils";
import { ModelSelect, useFloatingChatModel } from "./model-select";
import { useFloatingChatRuntime } from "./use-floating-chat-runtime";

function FloatingChatPanel({
  selectedModel,
  onModelChange,
}: {
  selectedModel: string;
  onModelChange: (modelName: string) => void;
}) {
  const runtime = useFloatingChatRuntime(selectedModel);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <AssistantModal
        header={
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <span className="shrink-0 text-xs font-medium text-muted-foreground">
              Model
            </span>
            <ModelSelect value={selectedModel} onValueChange={onModelChange} />
          </div>
        }
      />
    </AssistantRuntimeProvider>
  );
}

function FloatingChatLoadingButton() {
  return (
    <div
      className={cn(
        "fixed end-4 z-40 flex size-11 items-center justify-center",
        import.meta.env.DEV ? "bottom-20" : "bottom-4",
      )}
    >
      <TooltipIconButton
        variant="default"
        tooltip="Loading models..."
        side="left"
        disabled
        className="size-full rounded-full shadow"
      >
        <Loader2 className="size-5 animate-spin" />
        <span className="sr-only">Loading models</span>
      </TooltipIconButton>
    </div>
  );
}

export function FloatingChatWidget() {
  const { selectedModel, onModelChange, isLoading } = useFloatingChatModel();

  if (isLoading && !selectedModel) {
    return <FloatingChatLoadingButton />;
  }

  if (!selectedModel) {
    return (
      <div
        className={cn(
          "fixed end-4 z-40 flex size-11 items-center justify-center",
          import.meta.env.DEV ? "bottom-20" : "bottom-4",
        )}
      >
        <TooltipIconButton
          variant="default"
          tooltip="No enabled models"
          side="left"
          disabled
          className="size-full rounded-full shadow"
        >
          <BotIcon className="size-5" />
          <span className="sr-only">No enabled models</span>
        </TooltipIconButton>
      </div>
    );
  }

  return (
    <FloatingChatPanel
      selectedModel={selectedModel}
      onModelChange={onModelChange}
    />
  );
}
