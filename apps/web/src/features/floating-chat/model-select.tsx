import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { getAllModels } from "@/shared/lib/api-client/models";

const FLOATING_CHAT_MODEL_STORAGE_KEY = "floating-chat-model";

type ModelSelectProps = {
  value: string;
  onValueChange: (modelName: string) => void;
};

function readFloatingChatModel(): string {
  if (typeof localStorage === "undefined") {
    return "";
  }
  return localStorage.getItem(FLOATING_CHAT_MODEL_STORAGE_KEY) ?? "";
}

function writeFloatingChatModel(modelName: string): void {
  localStorage.setItem(FLOATING_CHAT_MODEL_STORAGE_KEY, modelName);
}

export function useFloatingChatModel() {
  const [selectedModel, setSelectedModel] = useState(readFloatingChatModel);
  const { data: models = [], isLoading } = useQuery({
    queryKey: ["floating-chat-models"],
    queryFn: getAllModels,
    staleTime: 60_000,
  });

  const enabledModels = useMemo(
    () => models.filter((model) => model.enabled !== false),
    [models],
  );

  useEffect(() => {
    if (selectedModel || enabledModels.length === 0) {
      return;
    }

    const stored = readFloatingChatModel();
    const nextValue =
      stored && enabledModels.some((model) => model.modelName === stored)
        ? stored
        : enabledModels[0]?.modelName;

    if (nextValue) {
      writeFloatingChatModel(nextValue);
      setSelectedModel(nextValue);
    }
  }, [enabledModels, selectedModel]);

  const onModelChange = (modelName: string) => {
    writeFloatingChatModel(modelName);
    setSelectedModel(modelName);
  };

  return {
    selectedModel,
    onModelChange,
    enabledModels,
    isLoading,
  };
}

export function ModelSelect({ value, onValueChange }: ModelSelectProps) {
  const { data: models = [], isLoading } = useQuery({
    queryKey: ["floating-chat-models"],
    queryFn: getAllModels,
    staleTime: 60_000,
  });

  const enabledModels = useMemo(
    () => models.filter((model) => model.enabled !== false),
    [models],
  );

  return (
    <Select
      value={value || undefined}
      onValueChange={onValueChange}
      disabled={isLoading || enabledModels.length === 0}
    >
      <SelectTrigger className="h-8 w-full max-w-full">
        <SelectValue
          placeholder={
            isLoading
              ? "Loading models..."
              : enabledModels.length === 0
                ? "No enabled models"
                : "Select model"
          }
        />
      </SelectTrigger>
      <SelectContent>
        {enabledModels.map((model) => (
          <SelectItem key={model.modelName} value={model.modelName}>
            {model.config?.displayName ?? model.modelName}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
