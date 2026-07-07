import { AlertCircle, Scale } from "lucide-react";
import { useBenchmarkComparison } from "@/features/models/hooks/use-benchmark-comparison";
import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";

interface BenchmarkComparisonDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  modelName: string;
  onImportField: (key: string, value: unknown, source: string) => void;
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "\u2014";
  if (typeof value === "boolean") return value ? "Sim" : "Não";
  return String(value);
}

function shouldShowImport(
  sourceValue: unknown,
  currentValue: unknown,
): boolean {
  if (sourceValue === null || sourceValue === undefined) return false;
  return String(sourceValue) !== String(currentValue ?? "");
}

export function BenchmarkComparisonDialog({
  open,
  onOpenChange,
  modelName,
  onImportField,
}: BenchmarkComparisonDialogProps) {
  const { data, isLoading, isError, error, refetch } =
    useBenchmarkComparison(modelName);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Comparar Benchmarks — {modelName}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Carregando dados de benchmark...
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 py-8">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="text-sm text-destructive">
              {error instanceof Error
                ? error.message
                : "Erro ao carregar dados de benchmark"}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
            >
              Tentar novamente
            </Button>
          </div>
        ) : !data || data.fields.length === 0 ? (
          <div className="py-8 text-center text-sm text-muted-foreground">
            Nenhum dado de benchmark disponível para este modelo
          </div>
        ) : (
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campo</TableHead>
                  <TableHead>Artificial Analysis</TableHead>
                  <TableHead>OpenRouter</TableHead>
                  <TableHead>Atual</TableHead>
                  <TableHead>Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.fields.map((field) => (
                  <TableRow key={field.key}>
                    <TableCell className="font-medium">{field.label}</TableCell>
                    <TableCell>{formatValue(field.aa?.value)}</TableCell>
                    <TableCell>
                      {formatValue(field.openrouter?.value)}
                    </TableCell>
                    <TableCell>{formatValue(field.currentValue)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {field.aa &&
                          shouldShowImport(
                            field.aa.value,
                            field.currentValue,
                          ) && (
                            <Button
                              variant="outline"
                              size="xs"
                               onClick={() => {
                                 onImportField(
                                   field.key,
                                   field.aa!.value,
                                   field.aa!.sourceLabel,
                                 );
                               }}
                            >
                              <Scale className="mr-1 h-3 w-3" />
                              Importar
                            </Button>
                          )}
                        {field.openrouter &&
                          shouldShowImport(
                            field.openrouter.value,
                            field.currentValue,
                          ) && (
                            <Button
                              variant="outline"
                              size="xs"
                               onClick={() => {
                                 onImportField(
                                   field.key,
                                   field.openrouter!.value,
                                   field.openrouter!.sourceLabel,
                                 );
                               }}
                            >
                              <Scale className="mr-1 h-3 w-3" />
                              Importar
                            </Button>
                          )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
