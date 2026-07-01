import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RefreshCw, Search, Trash2 } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/components/ui/alert-dialog";
import { Badge } from "@/shared/components/ui/badge";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import {
  deleteModelAlias,
  getAllModelAliases,
} from "@/shared/lib/api-client/model-aliases";

const ALL_TARGETS_VALUE = "__all_targets__";

export function ModelsAliasesPage() {
  const queryClient = useQueryClient();
  const [searchValue, setSearchValue] = useState("");
  const [targetFilter, setTargetFilter] = useState(ALL_TARGETS_VALUE);

  const aliasesQuery = useQuery({
    queryKey: ["model-aliases"],
    queryFn: getAllModelAliases,
  });

  const deleteAliasMutation = useMutation({
    mutationFn: deleteModelAlias,
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["model-aliases"],
      });
      toast.success("Alias removed");
    },
    onError: (error) => {
      toast.error(`Failed to remove alias: ${String(error)}`);
    },
  });

  const aliases = aliasesQuery.data?.aliases ?? [];
  const normalizedSearchValue = searchValue.trim().toLowerCase();
  const targetOptions = [
    ...new Set(aliases.map((entry) => entry.targetModel)),
  ].sort((left, right) => left.localeCompare(right));
  const filteredAliases = aliases.filter((entry) => {
    const matchesSearch =
      normalizedSearchValue.length === 0 ||
      entry.alias.toLowerCase().includes(normalizedSearchValue);
    const matchesTarget =
      targetFilter === ALL_TARGETS_VALUE || entry.targetModel === targetFilter;

    return matchesSearch && matchesTarget;
  });
  const errorMessage =
    (aliasesQuery.error ? String(aliasesQuery.error) : null) ||
    (deleteAliasMutation.error ? String(deleteAliasMutation.error) : null);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Model Aliases</h1>
          <p className="max-w-3xl text-sm text-muted-foreground">
            Review the manual routing aliases managed by the dashboard. Aliases
            only change routing names and always point to an existing target
            model.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-fit"
          onClick={() => {
            void aliasesQuery.refetch();
          }}
          disabled={aliasesQuery.isFetching}
        >
          <RefreshCw
            className={aliasesQuery.isFetching ? "animate-spin" : undefined}
          />
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader className="gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <CardTitle>Manual routing aliases</CardTitle>
            <CardDescription>
              Search by alias, filter by target model, and remove aliases
              without opening each model detail page.
            </CardDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Badge variant="outline">{aliases.length} total</Badge>
            <Badge variant="outline">{filteredAliases.length} visible</Badge>
            <Badge variant="outline">{targetOptions.length} targets</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 lg:flex-row">
            <div className="relative flex-1">
              <Search className="-translate-y-1/2 pointer-events-none absolute top-1/2 left-3 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchValue}
                onChange={(event) => {
                  setSearchValue(event.target.value);
                }}
                placeholder="Search aliases"
                className="pl-9"
              />
            </div>
            <Select value={targetFilter} onValueChange={setTargetFilter}>
              <SelectTrigger className="w-full lg:w-64">
                <SelectValue placeholder="Filter by target model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_TARGETS_VALUE}>
                  All target models
                </SelectItem>
                {targetOptions.map((targetModel) => (
                  <SelectItem key={targetModel} value={targetModel}>
                    {targetModel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {errorMessage ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {errorMessage}
            </div>
          ) : null}

          {aliasesQuery.isPending && !aliasesQuery.data ? (
            <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
              Loading aliases...
            </div>
          ) : aliases.length === 0 ? (
            <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
              No manual aliases configured yet.
            </div>
          ) : filteredAliases.length === 0 ? (
            <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
              No aliases match the current search and filter.
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Alias</TableHead>
                    <TableHead>Target model</TableHead>
                    <TableHead className="w-32 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAliases.map((entry) => {
                    const deletePending =
                      deleteAliasMutation.isPending &&
                      deleteAliasMutation.variables === entry.alias;

                    return (
                      <TableRow key={entry.alias}>
                        <TableCell className="font-mono text-xs">
                          {entry.alias}
                        </TableCell>
                        <TableCell>
                          <Link
                            to={`/models/${encodeURIComponent(entry.targetModel)}`}
                            className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
                          >
                            {entry.targetModel}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <div className="flex justify-end">
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon-sm"
                                  disabled={deletePending}
                                  title={`Remove alias ${entry.alias}`}
                                  aria-label={`Remove alias ${entry.alias}`}
                                >
                                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Remove alias
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Remove{" "}
                                    <span className="font-semibold">
                                      {entry.alias}
                                    </span>{" "}
                                    from the routing aliases for{" "}
                                    <span className="font-semibold">
                                      {entry.targetModel}
                                    </span>
                                    ? This only removes the routing name.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction asChild>
                                    <Button
                                      variant="destructive"
                                      size="sm"
                                      disabled={deletePending}
                                      onClick={() => {
                                        deleteAliasMutation.reset();
                                        void deleteAliasMutation.mutateAsync(
                                          entry.alias,
                                        );
                                      }}
                                    >
                                      Remove alias
                                    </Button>
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
