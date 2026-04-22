import type { AnalyticsCapabilities, ServerMode } from '../types/analytics';

export interface ServerModeResponse {
  mode: ServerMode;
  capabilities: AnalyticsCapabilities;
}

export async function fetchServerMode(): Promise<ServerModeResponse> {
  const response = await fetch('/api/mode');
  if (!response.ok) {
    throw new Error(`Failed to fetch server mode: ${response.status}`);
  }
  return response.json();
}
