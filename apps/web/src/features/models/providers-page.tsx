import { Badge } from "@/shared/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { useProvidersPage } from "./use-providers-page";

export function ProvidersPage() {
  const { providers, defaultProvider, isLoading, error } = useProvidersPage();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Providers</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          This deprecated surface is read-only. Manage providers, credentials,
          and model discovery in <span className="font-medium">apps/ui</span>.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-destructive">
          Unable to load providers: {String(error)}
        </p>
      ) : isLoading ? (
        <p className="text-sm text-muted-foreground">Loading providers…</p>
      ) : providers.length === 0 ? (
        <div className="rounded-md border p-6 text-center text-sm text-muted-foreground">
          No providers configured. Use apps/ui to manage providers.
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Base URL</TableHead>
                <TableHead>Stored credential</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers.map((provider) => (
                <TableRow key={provider.providerId}>
                  <TableCell className="font-mono text-xs">
                    {provider.providerName}
                    {defaultProvider === provider.providerName ? (
                      <Badge
                        variant="success"
                        className="ml-2 text-[10px] px-1.5 py-0"
                      >
                        default
                      </Badge>
                    ) : null}
                  </TableCell>
                  <TableCell className="text-xs">
                    {provider.provider ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {provider.baseUrl ?? "—"}
                  </TableCell>
                  <TableCell className="text-xs">
                    {provider.hasStoredSecret ? (
                      <Badge variant="outline">Stored securely</Badge>
                    ) : (
                      "—"
                    )}
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
