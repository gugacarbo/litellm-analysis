import { useMemo } from "react";
export function useHealthStatusDerived(allModels) {
  const sorted = useMemo(() => {
    return [...allModels].sort((a, b) => {
      const orderA =
        a.status === "unknown"
          ? 99
          : a.status === "error"
            ? 0
            : a.status === "unhealthy"
              ? 1
              : 2;
      const orderB =
        b.status === "unknown"
          ? 99
          : b.status === "error"
            ? 0
            : b.status === "unhealthy"
              ? 1
              : 2;
      return orderA - orderB || a.modelName.localeCompare(b.modelName);
    });
  }, [allModels]);
  const healthyCount = useMemo(
    () => sorted.filter((e) => e.status === "healthy").length,
    [sorted],
  );
  const unhealthyCount = useMemo(
    () => sorted.filter((e) => e.status === "unhealthy").length,
    [sorted],
  );
  const errorCount = useMemo(
    () => sorted.filter((e) => e.status === "error").length,
    [sorted],
  );
  const unknownCount = useMemo(
    () => sorted.filter((e) => e.status === "unknown").length,
    [sorted],
  );
  const avgResponseTime = useMemo(() => {
    const healthy = sorted.filter(
      (e) => e.status === "healthy" && e.responseTimeMs !== null,
    );
    if (healthy.length === 0) return null;
    return Math.round(
      healthy.reduce((sum, e) => sum + (e.responseTimeMs ?? 0), 0) /
        healthy.length,
    );
  }, [sorted]);
  return {
    sorted,
    healthyCount,
    unhealthyCount,
    errorCount,
    unknownCount,
    avgResponseTime,
  };
}
