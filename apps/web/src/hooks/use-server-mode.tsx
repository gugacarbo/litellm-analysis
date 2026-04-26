import { useQuery } from "@tanstack/react-query";
import { createContext, useCallback, useContext } from "react";
import { queryKeys } from "../lib/query-keys";
import { fetchServerMode } from "../lib/server-mode";
import type { AnalyticsCapabilities, ServerMode } from "../types/analytics";

interface ServerModeState {
  mode: ServerMode;
  capabilities: AnalyticsCapabilities;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

const ServerModeContext = createContext<ServerModeState | null>(null);

export function ServerModeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const serverModeQuery = useQuery({
    queryKey: queryKeys.serverMode,
    queryFn: fetchServerMode,
    staleTime: 60_000,
  });

  const refetch = useCallback(() => {
    void serverModeQuery.refetch();
  }, [serverModeQuery]);

  const mode = serverModeQuery.data?.mode ?? "api-only";
  const capabilities =
    serverModeQuery.data?.capabilities ?? ({} as AnalyticsCapabilities);

  return (
    <ServerModeContext.Provider
      value={{
        mode,
        capabilities,
        isLoading: serverModeQuery.isPending && !serverModeQuery.data,
        error:
          serverModeQuery.error instanceof Error ? serverModeQuery.error : null,
        refetch,
      }}
    >
      {children}
    </ServerModeContext.Provider>
  );
}

export function useServerMode(): ServerModeState {
  const context = useContext(ServerModeContext);
  if (!context) {
    throw new Error("useServerMode must be used within a ServerModeProvider");
  }
  return context;
}
