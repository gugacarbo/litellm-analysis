"use client";

import { useQuery } from "@tanstack/react-query";
import { Globe } from "lucide-react";
import { getAllModels, type ModelConfig } from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";
import { Badge } from "./badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

interface GlobalFallbackSelectorProps {
  value: string;
  onValueChange: (model: string) => void;
}

export function GlobalFallbackSelector({
  value,
  onValueChange,
}: GlobalFallbackSelectorProps) {
  const modelsQuery = useQuery({
    queryKey: queryKeys.models,
    queryFn: getAllModels,
  });

  const availableModels = (modelsQuery.data ?? []) as ModelConfig[];

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
      <div className="flex items-center gap-2">
        <Globe className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Global Fallback Model</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Used when all agent-specific fallbacks are exhausted.
      </p>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select global fallback model" />
        </SelectTrigger>
        <SelectContent>
          {availableModels.map((model) => (
            <SelectItem key={model.modelName} value={model.modelName}>
              {model.modelName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex items-center gap-2">
        <Badge variant="secondary">gpt-5.1 → {value}</Badge>
      </div>
    </div>
  );
}
