import { Database, Pencil, Trash2 } from 'lucide-react';
import type { ModelConfig } from '../../lib/api-client';
import {
  getApiBase,
  getInputCost,
  getOutputCost,
  getContextWindow,
  getMaxOutput,
} from '../../pages/models/models-utils';
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
} from '../alert-dialog';
import { Button } from '../button';
import { Card, CardContent, CardHeader, CardTitle } from '../card';
import { FeatureGate } from '../feature-gate';
import { Skeleton } from '../skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../table';

type ModelsTableCardProps = {
  models: ModelConfig[];
  loading: boolean;
  error: string | null;
  deleteModelName: string | null;
  onDeleteModelNameChange: (value: string | null) => void;
  onOpenEdit: (model: ModelConfig) => void;
  onDelete: () => void;
};

export function ModelsTableCard({
  models,
  loading,
  error,
  deleteModelName,
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
                <TableHead>API Base</TableHead>
                <TableHead className="text-right">Context</TableHead>
                <TableHead className="text-right">Max Output</TableHead>
                <TableHead className="text-right">Input ($/Mi)</TableHead>
                <TableHead className="text-right">Output ($/Mi)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.map((model) => (
                <TableRow key={model.modelName}>
                  <TableCell className="font-medium">
                    {model.modelName}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {getApiBase(model.litellmParams)}
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

                      <FeatureGate capability="deleteModel">
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
                                Are you sure you want to delete{' '}
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
                      </FeatureGate>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
