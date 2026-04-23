import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import type { AgentRoutingConfig } from '../types/agent-routing';

function isValidAgentRoutingConfig(value: unknown): value is AgentRoutingConfig {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return false;
  }
  for (const [key, val] of Object.entries(value)) {
    if (typeof key !== 'string' || typeof val !== 'string') {
      return false;
    }
  }
  return true;
}

export function useAgentRouting() {
  const [config, setConfig] = useState<AgentRoutingConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWithRetry = useCallback(async (url: string, options?: RequestInit, retries = 1): Promise<Response> => {
    const res = await fetch(url, options);
    if (!res.ok && retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 500));
      return fetchWithRetry(url, options, retries - 1);
    }
    return res;
  }, []);

  const fetchConfig = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchWithRetry('/agent-routing');
      if (!res.ok) throw new Error(`Failed to fetch config (${res.status})`);
      const data = await res.json();
      if (!isValidAgentRoutingConfig(data)) {
        setConfig({});
        return;
      }
      setConfig(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch config';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  }, [fetchWithRetry]);

  const updateConfig = useCallback(
    async (newConfig: AgentRoutingConfig) => {
      setError(null);
      try {
        const res = await fetch('/agent-routing', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ modelGroupAlias: newConfig }),
        });
        if (!res.ok) throw new Error(`Failed to update config (${res.status})`);
        const data: AgentRoutingConfig = await res.json();
        setConfig(data);
        toast.success('Agent routing config updated');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to update config';
        setError(msg);
        toast.error(msg);
      }
    },
    [],
  );

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return { config, isLoading, error, fetchConfig, updateConfig };
}
