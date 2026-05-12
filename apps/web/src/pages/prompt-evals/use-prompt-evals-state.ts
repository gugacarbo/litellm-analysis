import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { listEvals } from "../../lib/api-client/prompt-evals.js";
import type { EvalFormState, SortDirection, SortField } from "./types.js";

export function usePromptEvalsState() {
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("startedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [form, setForm] = useState<EvalFormState>({
    model: "litellm/gpt-4o",
    threshold: 0.8,
  });

  const runsQuery = useQuery({
    queryKey: ["prompt-evals", page],
    queryFn: () => listEvals(page, 20),
    refetchInterval: 5000, // Poll for updates
  });

  const modelsQuery = useQuery({
    queryKey: ["models"],
    queryFn: () =>
      import("../../lib/api-client/models.js").then((m) => m.getAllModels()),
  });

  // Update form default model when models load
  if (
    modelsQuery.data &&
    form.model === "litellm/gpt-4o" &&
    !modelsQuery.isLoading
  ) {
    const firstModel = modelsQuery.data[0]?.modelName;
    if (firstModel && firstModel !== form.model) {
      setForm((prev) => ({ ...prev, model: firstModel }));
    }
  }

  return {
    page,
    setPage,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    form,
    setForm,
    runs: runsQuery.data?.runs ?? [],
    total: runsQuery.data?.total ?? 0,
    runsLoading: runsQuery.isLoading,
    runsError: runsQuery.error,
    models: modelsQuery.data ?? [],
    modelsLoading: modelsQuery.isLoading,
  };
}
