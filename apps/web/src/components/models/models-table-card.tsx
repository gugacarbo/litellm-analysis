import { Database, Pencil, Trash2 } from "lucide-react";
import type { ModelConfig } from "../../lib/api-client/models";
import {
  getContextWindow,
  getHealthStatusLabel,
  getInputCost,
  getMaxOutput,
  getOutputCost,
  type ModelHealthEntry,
} from "../../pages/models/models-utils";
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
} from "../ui/alert-dialog";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Skeleton } from "../ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";

type ModelsTableCardProps = {
  models: ModelConfig[];
  loading: boolean;
  error: string | null;
  deleteModelName: string | null;
  modelsHealth?: ModelHealthEntry[];
  onDeleteModelNameChange: (value: string | null) => void;
  onOpenEdit: (model: ModelConfig) => void;
  onDelete: () => void;
};

const statusConfig: Record<
  string,
  {
    variant: "default" | "secondary" | "destructive" | "outline" | "success";
  }
> = {
  healthy: { variant: "success" },
  degraded: { variant: "secondary" },
  offline: { variant: "destructive" },
  unknown: { variant: "outline" },
};

export function ModelsTableCard({
  models,
  loading,
  error,
  deleteModelName,
  modelsHealth = [],
  onDeleteModelNameChange,
  onOpenEdit,
  onDelete,
}: ModelsTableCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Configured Models
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && <div className="p-4 text-destructive">Error: {error}</div>}

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : models.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No models configured. Add your first model to get started.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model Name</TableHead>
                <TableHead>Health</TableHead>
                <TableHead className="text-right">Context</TableHead>
                <TableHead className="text-right">Max Output</TableHead>
                <TableHead className="text-right">Input ($/Mi)</TableHead>
                <TableHead className="text-right">Output ($/Mi)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.map((model) => {
                const health = modelsHealth.find(
                  (h) => h.model === model.modelName,
                );

                return (
                  <TableRow key={model.modelName}>
                    <TableCell className="font-medium">
                      {model.modelName}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          statusConfig[health?.status ?? "healthy"]?.variant ??
                          "outline"
                        }
                      >
                        {getHealthStatusLabel(health?.status ?? "healthy")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {getContextWindow(model.litellmParams)}
                    </TableCell>
                    <TableCell className="text-right">
                      {getMaxOutput(model.litellmParams)}
                    </TableCell>
                    <TableCell className="text-right">
                      {getInputCost(model.litellmParams)}
                    </TableCell>
                    <TableCell className="text-right">
                      {getOutputCost(model.litellmParams)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => onOpenEdit(model)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() =>
                                onDeleteModelNameChange(model.modelName)
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Model</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete{" "}
                                <span className="font-semibold">
                                  {deleteModelName}
                                </span>
                                ? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel
                                onClick={() => onDeleteModelNameChange(null)}
                              >
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction asChild>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={onDelete}
                                >
                                  Delete
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
        )}
      </CardContent>
    </Card>
  );
}
