import type { SpendLogsChangedPayload } from "@lite-llm/contracts/ws-events";
import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/lib/query-keys";

export function invalidateSpendLogsFromWsEvent(
  queryClient: QueryClient,
  payload: SpendLogsChangedPayload,
  options?: { visibleRequestIds?: Iterable<string> },
): void {
  void queryClient.invalidateQueries({ queryKey: ["spend-logs"] });

  const changedRequestIds = payload.changedRequestIds;
  if (!changedRequestIds?.length) {
    return;
  }

  const visibleSet =
    options?.visibleRequestIds === undefined
      ? null
      : new Set(options.visibleRequestIds);

  for (const requestId of changedRequestIds) {
    if (visibleSet !== null && !visibleSet.has(requestId)) {
      continue;
    }

    void queryClient.invalidateQueries({
      queryKey: queryKeys.spendLogDetail(requestId),
    });
  }
}
