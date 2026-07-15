import { Badge } from "@/shared/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { useModelsPage } from "./use-models-page";

export function ModelsConfiguredPage() {
  const { models, modelsQuery } = useModelsPage();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Models</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          This deprecated surface is read-only. Manage models, routing, and
          synchronization in <span className="font-medium">apps/ui</span>.
        </p>
      </div>

      {modelsQuery.error ? (
        <p className="text-sm text-destructive">
          Unable to load models: {String(modelsQuery.error)}
        </p>
      ) : modelsQuery.isPending ? (
        <p className="text-sm text-muted-foreground">Loading models…</p>
      ) : models.length === 0 ? (
        <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
          No models configured.
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Enabled</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {models.map((model) => (
                <TableRow key={model.modelName}>
                  <TableCell className="font-mono text-xs">
                    {model.modelName}
                  </TableCell>
                  <TableCell className="text-xs">
                    {model.modelRoute.providerName ?? "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{model.status}</Badge>
                  </TableCell>
                  <TableCell>
                    {model.enabled === false ? "No" : "Yes"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
