import type { SpendLog } from "@lite-llm/api-contracts/analytics";
import { useQuery } from "@tanstack/react-query";
import { getSpendLogById } from "@/lib/api-client/spend";
import { queryKeys } from "@/lib/query-keys";

export interface UseRequestDetailPageResult {
  log: ReturnType<typeof useQuery<SpendLog | null | undefined>>;
}

export function useRequestDetailPage(
  requestId: string,
): UseRequestDetailPageResult {
  const log = useQuery<SpendLog | null | undefined>({
    queryKey: queryKeys.spendLogDetail(requestId),
    queryFn: () => getSpendLogById(requestId),
    enabled: Boolean(requestId),
  });

  return { log };
}
