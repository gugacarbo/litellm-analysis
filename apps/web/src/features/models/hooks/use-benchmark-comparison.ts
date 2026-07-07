import { useQuery } from "@tanstack/react-query";
import { fetchBenchmarkComparison } from "@/shared/lib/api-client/models";

export function useBenchmarkComparison(modelName: string) {
  return useQuery({
    queryKey: ["benchmark-comparison", modelName],
    queryFn: () => fetchBenchmarkComparison(modelName),
    enabled: !!modelName,
    staleTime: 0,
  });
}
