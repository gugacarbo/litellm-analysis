import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithQueryClient } from '../../__tests__/react-query-test-utils';
import type { AnalyticsCapabilities } from '../../types/analytics';

const mockCapabilities: AnalyticsCapabilities = {
  spendByModel: true,
  spendByUser: true,
  spendByKey: true,
  spendLogs: true,
  metricsSummary: true,
  dailySpendTrend: true,
  tokenDistribution: true,
  performanceMetrics: true,
  hourlyUsagePatterns: true,
  apiKeyStats: true,
  costEfficiency: true,
  modelDistribution: true,
  dailyTokenTrend: true,
  modelStatistics: true,
  models: true,
  errorLogs: true,
  detailedLatency: true,
  logMerge: true,
  filterOptions: true,
  createModel: true,
  updateModel: true,
  deleteModel: true,
  mergeModels: true,
  deleteModelLogs: true,
  agentRouting: true,
};

vi.mock('../../hooks/use-server-mode', () => ({
  useServerMode: () => ({
    mode: 'database',
    capabilities: mockCapabilities,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock('../../lib/api-client', () => ({
  getAgentRoutingConfig: vi.fn(),
  getAgentConfig: vi.fn(),
  updateAgentRoutingConfig: vi.fn(),
  updateAgentConfig: vi.fn(),
  getAllModels: vi.fn(),
}));

import {
  getAgentConfig,
  getAgentRoutingConfig,
  getAllModels,
  updateAgentConfig,
} from '../../lib/api-client';
import { AgentRoutingPage } from '../agent-routing';

describe('AgentRoutingPage', () => {
  const mockRoutingConfig = {
    sisyphus: 'qwen3.5-plus',
    oracle: 'kimi-k2.5',
  };

  const mockModels = [
    {
      modelName: 'qwen3.5-plus',
      litellmParams: { api_base: 'https://api.openai.com' },
    },
    {
      modelName: 'gpt-3.5-turbo',
      litellmParams: { api_base: 'https://api.openai.com' },
    },
    {
      modelName: 'kimi-k2.5',
      litellmParams: { api_base: 'https://api.anthropic.com' },
    },
    {
      modelName: 'glm-5',
      litellmParams: { api_base: 'https://api.anthropic.com' },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAgentConfig).mockResolvedValue({
      agents: {},
      categories: {},
    });
  });

  describe('Renderização', () => {
    it('deve renderizar tabela com agentes', async () => {
      vi.mocked(getAgentRoutingConfig).mockResolvedValueOnce(mockRoutingConfig);
      vi.mocked(getAllModels).mockResolvedValueOnce(mockModels);

      renderWithQueryClient(<AgentRoutingPage />);

      await waitFor(() => {
        expect(screen.getByText('Sisyphus')).toBeInTheDocument();
      });

      expect(screen.getByText('Oracle')).toBeInTheDocument();
      expect(screen.getByText('Prometheus')).toBeInTheDocument();
      expect(screen.getByText('Metis')).toBeInTheDocument();
    });

    it('deve mostrar loading state inicialmente', () => {
      vi.mocked(getAgentRoutingConfig).mockImplementation(
        () => new Promise(() => {}),
      );
      vi.mocked(getAllModels).mockResolvedValueOnce([]);

      renderWithQueryClient(<AgentRoutingPage />);

      const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletons.length).toBe(5);
    });

    it('deve mostrar erro quando fetch falha', async () => {
      vi.mocked(getAgentRoutingConfig).mockRejectedValueOnce(
        new Error('Failed to fetch'),
      );
      vi.mocked(getAgentConfig).mockResolvedValueOnce({
        agents: {},
        categories: {},
      });

      renderWithQueryClient(<AgentRoutingPage />);

      await waitFor(() => {
        expect(screen.getByText('Agent Routing')).toBeInTheDocument();
      });
    });

    it('deve mostrar modelos atribuídos corretamente', async () => {
      vi.mocked(getAgentRoutingConfig).mockResolvedValueOnce(mockRoutingConfig);
      vi.mocked(getAgentConfig).mockResolvedValueOnce({
        agents: {
          sisyphus: { model: 'qwen3.5-plus' },
          oracle: { model: 'kimi-k2.5' },
        },
        categories: {},
      });
      vi.mocked(getAllModels).mockResolvedValueOnce(mockModels);

      renderWithQueryClient(<AgentRoutingPage />);

      await waitFor(() => {
        expect(screen.getAllByText('qwen3.5-plus').length).toBeGreaterThan(0);
      });

      expect(screen.getAllByText('kimi-k2.5').length).toBeGreaterThan(0);
    });

    it('deve mostrar "Unassigned" para agentes sem modelo configurado', async () => {
      vi.mocked(getAgentRoutingConfig).mockResolvedValueOnce({});
      vi.mocked(getAgentConfig).mockResolvedValueOnce({
        agents: {},
        categories: {},
      });

      renderWithQueryClient(<AgentRoutingPage />);

      await waitFor(() => {
        const unassignedElements = screen.getAllByText('Unconfigured');
        expect(unassignedElements.length).toBe(11);
      });
    });

    it('deve renderizar seção de categorias colapsável', async () => {
      vi.mocked(getAgentRoutingConfig).mockResolvedValueOnce({});
      vi.mocked(getAllModels).mockResolvedValueOnce(mockModels);

      renderWithQueryClient(<AgentRoutingPage />);

      await waitFor(() => {
        expect(screen.getByText(/Categories \(8\)/)).toBeInTheDocument();
      });
    });

    it('deve expandir categorias ao clicar no botão', async () => {
      vi.mocked(getAgentRoutingConfig).mockResolvedValueOnce({});
      vi.mocked(getAllModels).mockResolvedValueOnce(mockModels);

      renderWithQueryClient(<AgentRoutingPage />);

      await waitFor(() => {
        expect(screen.getByText(/Categories \(8\)/)).toBeInTheDocument();
      });

      const toggleButton = screen
        .getByText(/Categories \(8\)/)
        .closest('button');
      if (toggleButton) {
        await userEvent.click(toggleButton);
      }

      await waitFor(() => {
        expect(screen.getByText('Visual Engineering')).toBeInTheDocument();
        expect(screen.getByText('Ultrabrain')).toBeInTheDocument();
      });
    });
  });

  describe('Feature Gate', () => {
    it('deve mostrar botões de editar quando agentRouting=true', async () => {
      vi.mocked(getAgentRoutingConfig).mockResolvedValueOnce(mockRoutingConfig);
      vi.mocked(getAgentConfig).mockResolvedValueOnce({
        agents: {},
        categories: {},
      });

      renderWithQueryClient(<AgentRoutingPage />);

      await waitFor(() => {
        expect(screen.getAllByTitle('Edit agent configuration').length).toBe(
          11,
        );
      });
    });
  });

  describe('Interação', () => {
    it('deve abrir dialog ao clicar em editar', async () => {
      vi.mocked(getAgentRoutingConfig).mockResolvedValueOnce(mockRoutingConfig);
      vi.mocked(getAgentConfig).mockResolvedValueOnce({
        agents: {},
        categories: {},
      });

      renderWithQueryClient(<AgentRoutingPage />);

      await waitFor(() => {
        expect(screen.getByText('Sisyphus')).toBeInTheDocument();
      });

      await userEvent.click(
        screen.getAllByTitle('Edit agent configuration')[0],
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Edit Agent Configuration:/),
        ).toBeInTheDocument();
      });
    });

    it('deve mostrar dropdown de modelos no dialog', async () => {
      vi.mocked(getAgentRoutingConfig).mockResolvedValueOnce(mockRoutingConfig);
      vi.mocked(getAgentConfig).mockResolvedValueOnce({
        agents: {},
        categories: {},
      });
      vi.mocked(getAllModels).mockResolvedValue(mockModels);

      renderWithQueryClient(<AgentRoutingPage />);

      await waitFor(() => {
        expect(screen.getByText('Sisyphus')).toBeInTheDocument();
      });

      await userEvent.click(
        screen.getAllByTitle('Edit agent configuration')[0],
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Edit Agent Configuration:/),
        ).toBeInTheDocument();
      });

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    it('deve chamar updateAgentRoutingConfig ao salvar', async () => {
      vi.mocked(getAgentRoutingConfig).mockResolvedValueOnce(mockRoutingConfig);
      vi.mocked(getAgentConfig).mockResolvedValueOnce({
        agents: {},
        categories: {},
      });
      vi.mocked(updateAgentConfig).mockResolvedValueOnce({
        success: true,
      } as never);

      renderWithQueryClient(<AgentRoutingPage />);

      await waitFor(() => {
        expect(screen.getByText('Sisyphus')).toBeInTheDocument();
      });

      await userEvent.click(
        screen.getAllByTitle('Edit agent configuration')[0],
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Edit Agent Configuration:/),
        ).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', {
        name: /Save Configuration/i,
      });
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(updateAgentConfig).toHaveBeenCalled();
      });
    });

    it('deve fechar dialog ao clicar em Cancel', async () => {
      vi.mocked(getAgentRoutingConfig).mockResolvedValueOnce(mockRoutingConfig);
      vi.mocked(getAgentConfig).mockResolvedValueOnce({
        agents: {},
        categories: {},
      });

      renderWithQueryClient(<AgentRoutingPage />);

      await waitFor(() => {
        expect(screen.getByText('Sisyphus')).toBeInTheDocument();
      });

      await userEvent.click(
        screen.getAllByTitle('Edit agent configuration')[0],
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Edit Agent Configuration:/),
        ).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await userEvent.click(cancelButton);

      await waitFor(() => {
        expect(
          screen.queryByText(/Edit Agent Configuration:/),
        ).not.toBeInTheDocument();
      });
    });

    it('deve mostrar "Edit Category Model Assignment" ao editar categoria', async () => {
      vi.mocked(getAgentRoutingConfig).mockResolvedValueOnce({});
      vi.mocked(getAgentConfig).mockResolvedValueOnce({
        agents: {},
        categories: {},
      });

      renderWithQueryClient(<AgentRoutingPage />);

      await waitFor(() => {
        expect(screen.getByText(/Categories \(8\)/)).toBeInTheDocument();
      });

      const toggleButton = screen
        .getByText(/Categories \(8\)/)
        .closest('button');
      if (toggleButton) {
        await userEvent.click(toggleButton);
      }

      await waitFor(() => {
        expect(screen.getByText('Visual Engineering')).toBeInTheDocument();
      });

      await userEvent.click(
        screen.getAllByTitle('Edit category configuration')[0],
      );

      await waitFor(() => {
        expect(
          screen.getByText(/Edit Category Configuration:/),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Layout', () => {
    it('deve exibir apenas a seção de agentes e categorias', async () => {
      vi.mocked(getAgentRoutingConfig).mockResolvedValueOnce({});
      vi.mocked(getAllModels).mockResolvedValueOnce(mockModels);

      renderWithQueryClient(<AgentRoutingPage />);

      await waitFor(() => {
        expect(screen.getByText('Sisyphus')).toBeInTheDocument();
      });

      expect(
        screen.queryByRole('tab', { name: 'Custom Aliases' }),
      ).not.toBeInTheDocument();
    });
  });
});
