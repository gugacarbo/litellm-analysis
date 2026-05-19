import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { listEvals } from "@/shared/lib/api-client/prompt-evals";
import type {
  EvalFormState,
  EvalInputCase,
  SortDirection,
  SortField,
} from "../types";

const CASES_STORAGE_KEY = "prompt-evals-cases";

const DEFAULT_CASES_TEXT = JSON.stringify(
  [
    {
      id: "case-1",
      input: "Classifique esta mensagem de suporte em billing.",
      expectedCategories: ["billing"],
    },
  ],
  null,
  2,
);

function validateCasesShape(data: unknown): EvalInputCase[] | null {
  if (!Array.isArray(data)) {
    return null;
  }

  const parsed: EvalInputCase[] = [];
  for (const item of data) {
    if (typeof item !== "object" || item === null) {
      return null;
    }
    const record = item as Record<string, unknown>;
    if (typeof record.id !== "string" || record.id.trim() === "") {
      return null;
    }
    if (typeof record.input !== "string" || record.input.trim() === "") {
      return null;
    }
    if (
      !Array.isArray(record.expectedCategories) ||
      record.expectedCategories.length === 0 ||
      record.expectedCategories.some(
        (value) => typeof value !== "string" || value.trim() === "",
      )
    ) {
      return null;
    }

    parsed.push({
      id: record.id,
      input: record.input,
      expectedCategories: record.expectedCategories as string[],
    });
  }

  return parsed;
}

function readInitialCasesText(): string {
  if (typeof window === "undefined") {
    return DEFAULT_CASES_TEXT;
  }
  const stored = window.localStorage.getItem(CASES_STORAGE_KEY);
  return stored ?? DEFAULT_CASES_TEXT;
}

function parseCases(casesText: string): {
  parsedCases: EvalInputCase[];
  casesError: string | null;
} {
  try {
    const parsedJson = JSON.parse(casesText) as unknown;
    const parsedCases = validateCasesShape(parsedJson);
    if (!parsedCases) {
      return {
        parsedCases: [],
        casesError:
          "Invalid cases JSON. Use an array of {id, input, expectedCategories}.",
      };
    }
    return { parsedCases, casesError: null };
  } catch {
    return {
      parsedCases: [],
      casesError: "Invalid JSON format for cases.",
    };
  }
}

export function usePromptEvalsState() {
  const [page, setPage] = useState(1);
  const [sortField, setSortField] = useState<SortField>("startedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [form, setForm] = useState<EvalFormState>({
    model: "litellm/gpt-4o",
    threshold: 0.8,
  });
  const [casesText, setCasesText] = useState<string>(readInitialCasesText);

  const runsQuery = useQuery({
    queryKey: ["prompt-evals", page],
    queryFn: () => listEvals(page, 20),
    refetchInterval: 5000, // Poll for updates
  });

  const modelsQuery = useQuery({
    queryKey: ["models"],
    queryFn: () =>
      import("@/shared/lib/api-client/models").then((m) => m.getAllModels()),
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

  const { parsedCases, casesError } = parseCases(casesText);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(CASES_STORAGE_KEY, casesText);
    }
  }, [casesText]);

  return {
    page,
    setPage,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    form,
    setForm,
    casesText,
    setCasesText,
    parsedCases,
    casesError,
    runs: runsQuery.data?.runs ?? [],
    total: runsQuery.data?.total ?? 0,
    runsLoading: runsQuery.isLoading,
    runsError: runsQuery.error,
    models: modelsQuery.data ?? [],
    modelsLoading: modelsQuery.isLoading,
  };
}
