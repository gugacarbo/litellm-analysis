import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { fetchServerMode } from '../lib/server-mode';
import type { AnalyticsCapabilities, ServerMode } from '../types/analytics';

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
  const [state, setState] = useState<{
    mode: ServerMode | null;
    capabilities: AnalyticsCapabilities | null;
    isLoading: boolean;
    error: Error | null;
  }>({
    mode: null,
    capabilities: null,
    isLoading: true,
    error: null,
  });

  const load = useCallback(() => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    fetchServerMode()
      .then((data) => {
        setState({
          mode: data.mode,
          capabilities: data.capabilities,
          isLoading: false,
          error: null,
        });
      })
      .catch((err) => {
        setState({
          mode: null,
          capabilities: null,
          isLoading: false,
          error: err instanceof Error ? err : new Error(String(err)),
        });
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (!state.mode || !state.capabilities) {
    return (
      <ServerModeContext.Provider
        value={{
          mode: 'api-only',
          capabilities: {} as AnalyticsCapabilities,
          isLoading: state.isLoading,
          error: state.error,
          refetch: load,
        }}
      >
        {children}
      </ServerModeContext.Provider>
    );
  }

  return (
    <ServerModeContext.Provider
      value={{
        mode: state.mode,
        capabilities: state.capabilities,
        isLoading: state.isLoading,
        error: state.error,
        refetch: load,
      }}
    >
      {children}
    </ServerModeContext.Provider>
  );
}

export function useServerMode(): ServerModeState {
  const context = useContext(ServerModeContext);
  if (!context) {
    throw new Error('useServerMode must be used within a ServerModeProvider');
  }
  return context;
}
