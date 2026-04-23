import type { AgentConfig, CategoryConfig } from '../../types/agent-routing';
import { fetchApi } from './core';

export type AgentConfigResponse = {
  type: 'agent' | 'category';
  key: string;
  config: AgentConfig;
};

export type CategoryConfigResponse = {
  type: 'category';
  key: string;
  config: CategoryConfig;
};

export type AgentConfigType = 'agent' | 'category';

export async function getAgentConfig(): Promise<{
  agents: Record<string, AgentConfig>;
  categories: Record<string, CategoryConfig>;
}> {
  return fetchApi('/agent-config');
}

export async function getAgentConfigByKey(key: string): Promise<{
  type: AgentConfigType;
  key: string;
  config: AgentConfig | CategoryConfig;
}> {
  return fetchApi(`/agent-config/${key}`);
}

export async function updateAgentConfig(
  key: string,
  type: AgentConfigType,
  config: AgentConfig | CategoryConfig,
  syncAliases: boolean = true,
): Promise<{ success: boolean }> {
  return fetchApi(`/agent-config/${key}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ type, config, syncAliases }),
  });
}

export async function deleteAgentConfig(
  key: string,
  type: AgentConfigType,
): Promise<{ success: boolean }> {
  return fetchApi(`/agent-config/${key}?type=${type}`, {
    method: 'DELETE',
  });
}

export async function saveAllAgentConfigs(
  agents: Record<string, AgentConfig>,
  categories: Record<string, CategoryConfig>,
): Promise<{ success: boolean }> {
  return fetchApi('/agent-config', {
    method: 'PUT',
    body: JSON.stringify({ agents, categories }),
  });
}
