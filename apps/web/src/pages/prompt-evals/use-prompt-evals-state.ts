import { type Query, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  type EvalRunDetail,
  getEval,
  listEvals,
} from "../../lib/api-client/prompt-evals.js";
import type { EvalFormState, SortDirection, SortField } from "./types.js";

export function usePromptEvalsState() {
  const [page, setPage] = useState(1);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
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

  const detailQuery = useQuery({
    queryKey: ["prompt-eval-detail", selectedRunId],
    queryFn: () => (selectedRunId ? getEval(selectedRunId) : null),
    enabled: !!selectedRunId,
    refetchInterval: (query: Query<EvalRunDetail | null, Error>) => {
      const data = query.state.data;
      if (!data) return 5000;
      const terminal = ["succeeded", "failed", "cancelled"];
      return terminal.includes(data.status) ? false : 2000;
    },
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
    selectedRunId,
    setSelectedRunId,
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
    detail: detailQuery.data ?? null,
    detailLoading: detailQuery.isLoading,
    models: modelsQuery.data ?? [],
    modelsLoading: modelsQuery.isLoading,
  };
}
