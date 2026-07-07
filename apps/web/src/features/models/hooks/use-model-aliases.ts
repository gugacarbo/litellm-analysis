import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { getModelAliases } from "@/shared/lib/api-client/model-aliases";

export interface UseModelAliasesResult {
  aliases: string[];
  initialAliases: string[];
  loaded: boolean;
  loading: boolean;
  error: string | null;
  isDirty: boolean;
  setAliases: (next: string[]) => void;
  resetForModel: (modelName: string) => void;
  getValidationError: () => string | null;
  normalizedAliases: string[];
}

export function normalizeAliases(aliases: string[]): string[] {
  return aliases
    .map((alias) => alias.trim())
    .filter(Boolean)
    .filter(
      (alias, index, allAliases) =>
        allAliases.findIndex(
          (candidate) => candidate.toLowerCase() === alias.toLowerCase(),
        ) === index,
    );
}

export function validateAliases(aliases: string[]): string | null {
  const normalizedAliases = aliases.map((alias) => alias.trim());

  for (const alias of normalizedAliases) {
    if (!alias) {
      return "Manual aliases cannot be empty.";
    }
  }

  const uniqueAliases = new Set(
    normalizedAliases.map((alias) => alias.toLowerCase()),
  );

  if (uniqueAliases.size !== normalizedAliases.length) {
    return "Manual aliases must be unique for this model.";
  }

  return null;
}

const ALIAS_LOAD_ERROR =
  "Failed to load saved routing aliases. Model settings can still be " +
  "saved, but alias changes will stay local until aliases load " +
  "successfully.";

export function useModelAliases(modelName: string): UseModelAliasesResult {
  const queryClient = useQueryClient();
  const [aliases, setAliasesState] = useState<string[]>([]);
  const [initialAliases, setInitialAliases] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const hydratedModelRef = useRef<string | null>(null);
  const aliasErrorToastModelRef = useRef<string | null>(null);
  const touchedRef = useRef(false);

  const aliasesQuery = useQuery({
    queryKey: ["model-aliases", modelName],
    queryFn: () => getModelAliases(modelName),
    enabled: modelName.length > 0,
  });

  const resetLocalAliasState = useCallback(() => {
    setAliasesState([]);
    setInitialAliases([]);
    setLoaded(false);
    setLoading(false);
    setError(null);
    hydratedModelRef.current = null;
    aliasErrorToastModelRef.current = null;
    touchedRef.current = false;
  }, []);

  // Whenever the model changes, reset local alias state so the next model's
  // aliases can hydrate cleanly. This must run before the query-effect below.
  const previousModelNameRef = useRef<string>("");
  useEffect(() => {
    if (previousModelNameRef.current !== modelName) {
      previousModelNameRef.current = modelName;
      resetLocalAliasState();
    }
  }, [modelName, resetLocalAliasState]);

  useEffect(() => {
    if (aliasesQuery.data) {
      const nextAliases = aliasesQuery.data.aliases;
      const shouldHydrateAliases =
        hydratedModelRef.current !== modelName && !touchedRef.current;

      hydratedModelRef.current = modelName;
      aliasErrorToastModelRef.current = null;

      if (shouldHydrateAliases) {
        setAliasesState(nextAliases);
        setInitialAliases(nextAliases);
      }

      setLoaded(true);
      setLoading(false);
      setError(null);
      return;
    }

    if (aliasesQuery.isError) {
      const isNewModelOrUnhydrated =
        hydratedModelRef.current !== modelName;
      if (isNewModelOrUnhydrated) {
        hydratedModelRef.current = modelName;
      }

      setLoaded(false);
      setLoading(false);
      setError(ALIAS_LOAD_ERROR);

      if (
        isNewModelOrUnhydrated &&
        aliasErrorToastModelRef.current !== modelName
      ) {
        aliasErrorToastModelRef.current = modelName;
        toast.error(ALIAS_LOAD_ERROR);
      }

      return;
    }

    if (aliasesQuery.isPending) {
      setLoading(true);
      setError(null);
    }
  }, [
    modelName,
    aliasesQuery.data,
    aliasesQuery.isError,
    aliasesQuery.isPending,
  ]);

  const setAliases = useCallback((next: string[]) => {
    setAliasesState(() => {
      touchedRef.current = true;
      return next;
    });
  }, []);

  const resetForModel = useCallback((nextModelName: string) => {
    setAliasesState([]);
    setInitialAliases([]);
    setLoaded(false);
    setLoading(false);
    setError(null);
    hydratedModelRef.current = null;
    aliasErrorToastModelRef.current = null;
    touchedRef.current = false;

    if (nextModelName) {
      void queryClient.invalidateQueries({
        queryKey: ["model-aliases", nextModelName],
      });
    }
  }, [queryClient]);

  const normalizedAliases = useMemo(
    () => normalizeAliases(aliases),
    [aliases],
  );

  const getValidationError = useCallback(
    () => validateAliases(aliases),
    [aliases],
  );

  const isDirty = useMemo(
    () =>
      JSON.stringify(normalizeAliases(aliases)) !==
      JSON.stringify(normalizeAliases(initialAliases)),
    [aliases, initialAliases],
  );

  return {
    aliases,
    initialAliases,
    loaded,
    loading,
    error,
    isDirty,
    setAliases,
    resetForModel,
    getValidationError,
    normalizedAliases,
  };
}
