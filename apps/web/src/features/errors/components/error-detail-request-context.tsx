import type { ErrorLog } from "@lite-llm/contracts/analytics";
import { Cpu, KeyRound, User } from "lucide-react";

type ErrorDetailRequestContextProps = {
  errorLog: ErrorLog;
};

export function ErrorDetailRequestContext({
  errorLog,
}: ErrorDetailRequestContextProps) {
  const apiKey = errorLog.api_key;

  return (
    <section className="overflow-hidden rounded-lg border">
      <div className="border-b bg-muted/30 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Request Context
      </div>
      <dl className="divide-y divide-border">
        <div className="grid grid-cols-[120px_1fr] gap-3 px-3 py-2.5">
          <dt className="flex items-center gap-2 text-xs text-muted-foreground">
            <KeyRound className="h-3.5 w-3.5" />
            Request ID
          </dt>
          <dd className="font-mono text-xs break-all">{errorLog.id || "-"}</dd>
        </div>

        <div className="grid grid-cols-[120px_1fr] gap-3 px-3 py-2.5">
          <dt className="flex items-center gap-2 text-xs text-muted-foreground">
            <Cpu className="h-3.5 w-3.5" />
            Model
          </dt>
          <dd className="text-sm break-all font-mono">
            {errorLog.model || "-"}
          </dd>
        </div>

        <div className="grid grid-cols-[120px_1fr] gap-3 px-3 py-2.5">
          <dt className="flex items-center gap-2 text-xs text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            User
          </dt>
          <dd className="text-sm break-all">{errorLog.user || "-"}</dd>
        </div>

        {apiKey && (
          <div className="grid grid-cols-[120px_1fr] gap-3 px-3 py-2.5">
            <dt className="flex items-center gap-2 text-xs text-muted-foreground">
              <KeyRound className="h-3.5 w-3.5" />
              API Key
            </dt>
            <dd className="font-mono text-xs break-all">{apiKey}</dd>
          </div>
        )}
      </dl>
    </section>
  );
}
