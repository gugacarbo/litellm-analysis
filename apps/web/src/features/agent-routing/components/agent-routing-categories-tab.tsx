import type { CategoryEntry } from "@lite-llm/contracts/category";
import { Folder, Pencil, Plus, Trash2 } from "lucide-react";
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
} from "../../../components/ui/alert-dialog";
import { Badge } from "../../../components/ui/badge";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { EntityRoutingCard } from "./entity-routing-card";

type AgentRoutingCategoriesTabProps = {
  loading: boolean;
  categories: Record<string, CategoryEntry>;
  onCreateCategory: () => void;
  onEditCategory: (key: string) => void;
  onDeleteCategory: (key: string) => void;
};

export function AgentRoutingCategoriesTab({
  loading,
  categories,
  onCreateCategory,
  onEditCategory,
  onDeleteCategory,
}: AgentRoutingCategoriesTabProps) {
  const safeCategories = categories ?? {};
  const entries = Object.entries(safeCategories);
  const configuredCount = entries.filter(
    ([, cat]) => cat.model !== "" && cat.model !== undefined,
  ).length;

  return (
    <EntityRoutingCard
      icon={Folder}
      title="Categories"
      totalCount={entries.length}
      configuredCount={configuredCount}
    >
      <div className="flex justify-end mb-3">
        <Button size="sm" onClick={onCreateCategory}>
          <Plus className="h-4 w-4 me-1" />
          Create Category
        </Button>
      </div>
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No categories configured.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {entries.map(([key, cat]) => (
            <Card key={key} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{cat.icon ?? "📂"}</span>
                    <div>
                      <CardTitle className="text-sm">{key}</CardTitle>
                      <p className="text-xs text-muted-foreground font-mono">
                        {cat.model || "No model assigned"}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onEditCategory(key)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Category</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete the category &quot;
                            {key}&quot;? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => onDeleteCategory(key)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {cat.description || "No description"}
                </p>
                <div className="flex flex-wrap gap-1">
                  {cat.limits?.context && (
                    <Badge variant="outline" className="text-xs">
                      {cat.limits.context.toLocaleString()} ctx
                    </Badge>
                  )}
                  {cat.temperature !== undefined && cat.temperature !== 0 && (
                    <Badge variant="secondary" className="text-xs">
                      temp: {cat.temperature}
                    </Badge>
                  )}
                  {cat.reasoningEffort && (
                    <Badge variant="secondary" className="text-xs">
                      {cat.reasoningEffort}
                    </Badge>
                  )}
                  {cat.is_unstable_agent && (
                    <Badge variant="destructive" className="text-xs">
                      unstable
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </EntityRoutingCard>
  );
}
