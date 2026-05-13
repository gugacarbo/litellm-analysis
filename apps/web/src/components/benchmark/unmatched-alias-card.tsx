import type { ModelBenchmarkListItem } from "@lite-llm/api-contracts";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2, Unlink } from "lucide-react";
import { useState } from "react";
import { getModelAliases, putModelAliases } from "../../lib/api-client";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

interface UnmatchedAliasCardProps {
  unmatchedModels: string[];
  allModels: ModelBenchmarkListItem[];
}

function filterModels(
  query: string,
  allModels: ModelBenchmarkListItem[],
): ModelBenchmarkListItem[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return allModels.slice(0, 20);
  return allModels
    .filter(
      (m) =>
        m.name.toLowerCase().includes(needle) ||
        (m.slug ?? "").toLowerCase().includes(needle) ||
        m.creatorName.toLowerCase().includes(needle),
    )
    .slice(0, 20);
}

export function UnmatchedAliasCard({
  unmatchedModels,
  allModels,
}: UnmatchedAliasCardProps) {
  const queryClient = useQueryClient();
  const [selections, setSelections] = useState<Record<string, string>>({});

  const aliasesQuery = useQuery({
    queryKey: ["benchmarks", "aliases"],
    queryFn: getModelAliases,
  });

  const existingAliases = aliasesQuery.data?.aliases ?? {};

  const mutation = useMutation({
    mutationFn: putModelAliases,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["benchmarks", "aliases"] });
      queryClient.invalidateQueries({ queryKey: ["benchmarks", "models"] });
      setSelections({});
    },
  });

  if (unmatchedModels.length === 0) return null;

  const handleLink = (configuredModel: string) => {
    const aaReference = selections[configuredModel]?.trim();
    if (!aaReference) return;

    const newAliases = { ...existingAliases, [configuredModel]: aaReference };
    mutation.mutate({ aliases: newAliases });
  };

  const handleUnlink = (configuredModel: string) => {
    const newAliases = { ...existingAliases };
    delete newAliases[configuredModel];
    mutation.mutate({ aliases: newAliases });
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Link2 className="h-4 w-4" />
          Model Aliases
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {unmatchedModels.length} configured model
          {unmatchedModels.length !== 1 ? "s" : ""} not found in the benchmark
          dataset. Link them to an Artificial Analysis model name or slug.
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {unmatchedModels.map((model) => {
          const linkedTarget = existingAliases[model];

          return (
            <div key={model} className="flex items-center gap-2">
              <span className="text-sm font-mono text-muted-foreground min-w-0 truncate flex-1">
                {model}
              </span>

              {linkedTarget ? (
                <>
                  <span className="text-xs text-green-600 max-w-[200px] truncate">
                    → {linkedTarget}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleUnlink(model)}
                    disabled={mutation.isPending}
                    title={`Unlink from "${linkedTarget}"`}
                  >
                    <Unlink className="h-4 w-4" />
                  </Button>
                </>
              ) : (
                <>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="max-w-[260px] justify-start"
                        disabled={mutation.isPending}
                      >
                        {selections[model]
                          ? selections[model]
                          : "Search AA model..."}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[300px] p-0" align="start">
                      <ModelSearchCommand
                        models={allModels}
                        selectedValue={selections[model] ?? ""}
                        onSelect={(value) =>
                          setSelections((prev) => ({
                            ...prev,
                            [model]: value,
                          }))
                        }
                      />
                    </PopoverContent>
                  </Popover>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleLink(model)}
                    disabled={mutation.isPending || !selections[model]?.trim()}
                  >
                    Link
                  </Button>
                </>
              )}
            </div>
          );
        })}
        {mutation.isError && (
          <p className="text-xs text-red-500">
            Failed to save:{" "}
            {mutation.error instanceof Error
              ? mutation.error.message
              : "Unknown error"}
          </p>
        )}
        {mutation.isSuccess && (
          <p className="text-xs text-green-600">Alias saved successfully.</p>
        )}
      </CardContent>
    </Card>
  );
}

function ModelSearchCommand({
  models,
  selectedValue,
  onSelect,
}: {
  models: ModelBenchmarkListItem[];
  selectedValue: string;
  onSelect: (value: string) => void;
}) {
  const [search, setSearch] = useState(selectedValue);

  const filtered = filterModels(search, models);

  return (
    <Command>
      <CommandInput
        placeholder="Type to search..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No model found.</CommandEmpty>
        <CommandGroup>
          {filtered.map((m) => (
            <CommandItem
              key={m.id}
              value={`${m.name} | ${m.slug ?? "no-slug"} | ${m.creatorName}`}
              onSelect={() => {
                onSelect(m.slug ?? m.name);
                setSearch(m.slug ?? m.name);
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-medium truncate">{m.name}</span>
                <span className="text-xs text-muted-foreground shrink-0">
                  {m.creatorName}
                </span>
              </div>
              {m.slug && (
                <span className="text-[10px] text-muted-foreground ml-auto">
                  {m.slug}
                </span>
              )}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </Command>
  );
}
