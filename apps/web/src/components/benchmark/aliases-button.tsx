import { Link2, Unlink } from "lucide-react";
import { useState } from "react";
import { getModelAliases, putModelAliases } from "../../lib/api-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "../ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "../ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import type { ModelBenchmarkListItem } from "@lite-llm/api-contracts";

interface AliasesButtonProps {
  configuredModels: string[];
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
        (m.slug ?? "").toLowerCase().includes(needle) ||
        m.name.toLowerCase().includes(needle),
    )
    .slice(0, 20);
}

export function AliasesButton({
  configuredModels,
  unmatchedModels,
  allModels,
}: AliasesButtonProps) {
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
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="relative">
          <Link2 className="h-4 w-4 mr-1" />
          Aliases
          {unmatchedModels.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
              {unmatchedModels.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[380px] p-0" align="end">
        <div className="flex flex-col max-h-[420px]">
          <div className="border-b px-3 py-2">
            <p className="text-xs text-muted-foreground">
              Map configured model names to AA benchmark entries.
            </p>
          </div>

          {configuredModels.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No configured models.
            </div>
          ) : (
            <div className="overflow-y-auto flex-1">
              {unmatchedModels.length > 0 && (
                <>
                  <div className="px-3 py-1.5 bg-red-50 dark:bg-red-950/20">
                    <p className="text-[10px] font-medium text-red-600 dark:text-red-400 uppercase tracking-wider">
                      Unmatched — {unmatchedModels.length}
                    </p>
                  </div>
                  <div className="divide-y">
                    {unmatchedModels.map((model) => {
                      const linkedTarget = existingAliases[model];

                      return (
                        <div key={model} className="flex items-center gap-2 p-2">
                          <span className="text-xs font-mono text-muted-foreground min-w-0 truncate flex-1">
                            {model}
                          </span>

                          {linkedTarget ? (
                            <>
                              <span className="text-[10px] text-green-600 max-w-[120px] truncate">
                                → {linkedTarget}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 shrink-0"
                                onClick={() => handleUnlink(model)}
                                disabled={mutation.isPending}
                                title={`Unlink from "${linkedTarget}"`}
                              >
                                <Unlink className="h-3 w-3" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <ModelSearchCombobox
                                models={allModels}
                                selectedValue={selections[model] ?? ""}
                                onSelect={(value) =>
                                  setSelections((prev) => ({
                                    ...prev,
                                    [model]: value,
                                  }))
                                }
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-6 text-xs shrink-0"
                                onClick={() => handleLink(model)}
                                disabled={
                                  mutation.isPending ||
                                  !selections[model]?.trim()
                                }
                              >
                                Link
                              </Button>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              <div className="px-3 py-1.5 bg-muted/50">
                <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                  All configured — {configuredModels.length}
                </p>
              </div>
              <div className="divide-y">
                {configuredModels.map((model) => {
                  const linkedTarget = existingAliases[model];
                  const isUnmatched = unmatchedModels.includes(model);

                  return (
                    <div
                      key={model}
                      className="flex items-center gap-2 p-2"
                    >
                      <span className="text-xs font-mono text-muted-foreground min-w-0 truncate flex-1">
                        {model}
                      </span>

                      {isUnmatched ? null : linkedTarget ? (
                        <>
                          <span className="text-[10px] text-green-600 max-w-[120px] truncate">
                            → {linkedTarget}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => handleUnlink(model)}
                            disabled={mutation.isPending}
                            title={`Unlink from "${linkedTarget}"`}
                          >
                            <Unlink className="h-3 w-3" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <span className="text-[10px] text-muted-foreground italic">
                            (no alias)
                          </span>
                          <ModelSearchCombobox
                            models={allModels}
                            selectedValue={selections[model] ?? ""}
                            onSelect={(value) =>
                              setSelections((prev) => ({ ...prev, [model]: value }))
                            }
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 text-xs shrink-0"
                            onClick={() => handleLink(model)}
                            disabled={
                              mutation.isPending || !selections[model]?.trim()
                            }
                          >
                            Link
                          </Button>
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {mutation.isError && (
            <div className="border-t px-3 py-1.5">
              <p className="text-xs text-red-500">
                Save failed:{" "}
                {mutation.error instanceof Error
                  ? mutation.error.message
                  : "Unknown error"}
              </p>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ModelSearchCombobox({
  models,
  selectedValue,
  onSelect,
}: {
  models: ModelBenchmarkListItem[];
  selectedValue: string;
  onSelect: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState(selectedValue);

  const filtered = filterModels(search, models);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-6 text-xs max-w-[140px] justify-start truncate"
          onClick={() => setOpen(true)}
        >
          {selectedValue || "Search..."}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[260px] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Type to search..."
            value={search}
            onValueChange={setSearch}
            className="h-8 text-xs"
          />
          <CommandList>
            <CommandEmpty>No model found.</CommandEmpty>
            <CommandGroup>
              {filtered.map((m) => (
                <CommandItem
                  key={m.id}
                  value={m.slug ?? m.name}
                  onSelect={() => {
                    onSelect(m.slug ?? m.name);
                    setSearch(m.slug ?? m.name);
                    setOpen(false);
                  }}
                  className="text-xs"
                >
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="truncate">{m.name}</span>
                    <span className="text-[10px] text-muted-foreground shrink-0">
                      {m.creatorName}
                    </span>
                  </div>
                  {m.slug && (
                    <span className="text-[9px] text-muted-foreground ml-auto">
                      {m.slug}
                    </span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
