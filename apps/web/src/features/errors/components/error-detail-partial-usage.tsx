import type { ErrorLog } from "@lite-llm/contracts/analytics";
import { Clock, DollarSign, Hash } from "lucide-react";
import { APP_LOCALE } from "@/shared/lib/locale";
import { formatDuration } from "@/shared/lib/spend-log-utils";

type ErrorDetailPartialUsageProps = {
  errorLog: ErrorLog;
};

export function ErrorDetailPartialUsage({
  errorLog,
}: ErrorDetailPartialUsageProps) {
  if (errorLog.total_tokens == null || errorLog.total_tokens <= 0) {
    return null;
  }

  return (
    <section className="overflow-hidden rounded-lg border">
      <div className="border-b bg-muted/30 px-3 py-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Partial Usage (Before Error)
      </div>
      <div className="p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-muted/20 px-3 py-2.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Hash className="h-3.5 w-3.5" />
              Tokens Used
            </div>
            <div className="mt-1 text-sm font-medium">
              {errorLog.total_tokens?.toLocaleString(APP_LOCALE) || "-"}
            </div>
          </div>
          <div className="rounded-lg border bg-muted/20 px-3 py-2.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <DollarSign className="h-3.5 w-3.5" />
              Spend Incurred
            </div>
            <div className="mt-1 text-sm font-medium text-amber-600">
              {errorLog.spend != null ? `$${errorLog.spend.toFixed(4)}` : "-"}
            </div>
          </div>
          <div className="rounded-lg border bg-muted/20 px-3 py-2.5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              Time to Error
            </div>
            <div className="mt-1 text-sm font-medium">
              {errorLog.end_time && errorLog.timestamp
                ? formatDuration(
                    new Date(errorLog.end_time).getTime() -
                      new Date(errorLog.timestamp).getTime(),
                  )
                : "-"}
            </div>
          </div>
        </div>

        {(errorLog.prompt_tokens != null ||
          errorLog.completion_tokens != null) && (
          <div className="mt-3">
            <div className="flex items-center gap-4 text-xs mb-2">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
                <span className="text-muted-foreground">
                  Prompt:{" "}
                  {errorLog.prompt_tokens?.toLocaleString(APP_LOCALE) || "0"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                <span className="text-muted-foreground">
                  Completion:{" "}
                  {errorLog.completion_tokens?.toLocaleString(APP_LOCALE) ||
                    "0"}
                </span>
              </div>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden flex">
              {errorLog.total_tokens != null && errorLog.total_tokens > 0 && (
                <>
                  <div
                    className="bg-blue-500 h-full transition-all"
                    style={{
                      width: `${
                        ((errorLog.prompt_tokens || 0) /
                          errorLog.total_tokens) *
                        100
                      }%`,
                    }}
                  />
                  <div
                    className="bg-amber-500 h-full transition-all"
                    style={{
                      width: `${
                        ((errorLog.completion_tokens || 0) /
                          errorLog.total_tokens) *
                        100
                      }%`,
                    }}
                  />
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
