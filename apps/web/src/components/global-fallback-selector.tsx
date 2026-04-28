"use client";

import { useQuery } from "@tanstack/react-query";
import { ChevronDown, Globe } from "lucide-react";
import { useState } from "react";
import { getAllModels, type ModelConfig } from "../lib/api-client";
import { queryKeys } from "../lib/query-keys";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./dialog";

interface GlobalFallbackSelectorProps {
  value: string;
  onValueChange: (model: string) => void;
}

export function GlobalFallbackSelector({
  value,
  onValueChange,
}: GlobalFallbackSelectorProps) {
  const [open, setOpen] = useState(false);

  const modelsQuery = useQuery({
    queryKey: queryKeys.models,
    queryFn: getAllModels,
  });

  const availableModels = (modelsQuery.data ?? []) as ModelConfig[];

  const handleSelect = (model: string) => {
    onValueChange(model);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-8 text-xs">
          <Globe className="h-3 w-3 text-muted-foreground" />
          <span className="text-muted-foreground">Fallback:</span>
          <span className="font-medium">{value || "None"}</span>
          <ChevronDown className="h-3 w-3 text-muted-foreground ml-1" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Global Fallback Model
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Used when all agent-specific fallbacks are exhausted.
        </p>
        <div className="max-h-[300px] overflow-y-auto mt-2">
          <div className="space-y-1">
            {availableModels.map((model) => (
              <button
                type="button"
                key={model.modelName}
                onClick={() => handleSelect(model.modelName)}
                className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                  value === model.modelName
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                }`}
              >
                {model.modelName}
              </button>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
