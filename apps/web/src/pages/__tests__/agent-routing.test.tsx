import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
  databaseAccess: true,
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
  updateAgentRoutingConfig: vi.fn(),
  getAllModels: vi.fn(),
}));

import { AgentRoutingPage } from '../agent-routing';
import {
  getAgentRoutingConfig,
  updateAgentRoutingConfig,
  getAllModels,
} from '../../lib/api-client';

describe('AgentRoutingPage', () => {
  const mockRoutingConfig = {
    sisyphus: 'qwen3.5-plus',
    oracle: 'kimi-k2.5',
  };

  const mockModels = [
    { modelName: 'qwen3.5-plus', litellmParams: { api_base: 'https://api.openai.com' } },
    { modelName: 'gpt-3.5-turbo', litellmParams: { api_base: 'https://api.openai.com' } },
    { modelName: 'kimi-k2.5', litellmParams: { api_base: 'https://api.anthropic.com' } },
    { modelName: 'glm-5', litellmParams: { api_base: 'https://api.anthropic.com' } },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Renderização', () => {
    it('deve renderizar tabela com agentes', async () => {
      vi.mocked(getAgentRoutingConfig).mockResolvedValueOnce(mockRoutingConfig);
      vi.mocked(getAllModels).mockResolvedValueOnce(mockModels);

      render(<AgentRoutingPage />);

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

      render(<AgentRoutingPage />);

      const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletons.length).toBe(5);
    });

    it('deve mostrar erro quando fetch falha', async () => {
      vi.mocked(getAgentRoutingConfig).mockRejectedValueOnce(
        new Error('Failed to fetch'),
      );
      vi.mocked(getAllModels).mockResolvedValueOnce([]);

      render(<AgentRoutingPage />);

      await waitFor(() => {
        expect(screen.getByText(/Error:/)).toBeInTheDocument();
      });

      expect(screen.getByText(/Failed to fetch/)).toBeInTheDocument();
    });

    it('deve mostrar modelos atribuídos corretamente', async () => {
      vi.mocked(getAgentRoutingConfig).mockResolvedValueOnce(mockRoutingConfig);
      vi.mocked(getAllModels).mockResolvedValueOnce(mockModels);

      render(<AgentRoutingPage />);

      await waitFor(() => {
        expect(screen.getByText('qwen3.5-plus')).toBeInTheDocument();
      });

      expect(screen.getByText('kimi-k2.5')).toBeInTheDocument();
    });

    it('deve mostrar "Unassigned" para agentes sem modelo configurado', async () => {
      vi.mocked(getAgentRoutingConfig).mockResolvedValueOnce({});
      vi.mocked(getAllModels).mockResolvedValueOnce(mockModels);

      render(<AgentRoutingPage />);

      await waitFor(() => {
        const unassignedElements = screen.getAllByText('Unassigned');
        expect(unassignedElements.length).toBe(11);
      });
    });

    it('deve renderizar seção de categorias colapsável', async () => {
      vi.mocked(getAgentRoutingConfig).mockResolvedValueOnce({});
      vi.mocked(getAllModels).mockResolvedValueOnce(mockModels);

      render(<AgentRoutingPage />);

      await waitFor(() => {
        expect(screen.getByText(/Categories \(8\)/)).toBeInTheDocument();
      });
    });

    it('deve expandir categorias ao clicar no botão', async () => {
      vi.mocked(getAgentRoutingConfig).mockResolvedValueOnce({});
      vi.mocked(getAllModels).mockResolvedValueOnce(mockModels);

      render(<AgentRoutingPage />);

      await waitFor(() => {
        expect(screen.getByText(/Categories \(8\)/)).toBeInTheDocument();
      });

      const toggleButton = screen.getByText(/Categories \(8\)/).closest('button');
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
    it('deve mostrar botões de editar quando databaseAccess=true', async () => {
      vi.mocked(getAgentRoutingConfig).mockResolvedValueOnce(mockRoutingConfig);
      vi.mocked(getAllModels).mockResolvedValueOnce(mockModels);

      render(<AgentRoutingPage />);

      await waitFor(() => {
        const editButtons = screen.getAllByRole('button', { name: '' }).filter(
          (btn) => btn.querySelector('svg.lucide-pencil'),
        );
        expect(editButtons.length).toBe(11);
      });
    });
  });

  describe('Interação', () => {
    it('deve abrir dialog ao clicar em editar', async () => {
      vi.mocked(getAgentRoutingConfig).mockResolvedValueOnce(mockRoutingConfig);
      vi.mocked(getAllModels).mockResolvedValueOnce(mockModels);

      render(<AgentRoutingPage />);

      await waitFor(() => {
        expect(screen.getByText('Sisyphus')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole('button', { name: '' }).filter(
        (btn) => btn.querySelector('svg.lucide-pencil'),
      );

      await userEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(
          screen.getByText('Edit Agent Model Assignment'),
        ).toBeInTheDocument();
      });
    });

    it('deve mostrar dropdown de modelos no dialog', async () => {
      vi.mocked(getAgentRoutingConfig).mockResolvedValueOnce(mockRoutingConfig);
      vi.mocked(getAllModels).mockResolvedValueOnce(mockModels);

      render(<AgentRoutingPage />);

      await waitFor(() => {
        expect(screen.getByText('Sisyphus')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole('button', { name: '' }).filter(
        (btn) => btn.querySelector('svg.lucide-pencil'),
      );
      await userEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(
          screen.getByText('Edit Agent Model Assignment'),
        ).toBeInTheDocument();
      });

      expect(
        screen.getByRole('combobox', { expanded: false }),
      ).toBeInTheDocument();
    });

    it('deve chamar updateAgentRoutingConfig ao salvar', async () => {
      vi.mocked(getAgentRoutingConfig).mockResolvedValueOnce(mockRoutingConfig);
      vi.mocked(getAllModels).mockResolvedValueOnce(mockModels);
      vi.mocked(updateAgentRoutingConfig).mockResolvedValueOnce({
        success: true,
      } as never);

      render(<AgentRoutingPage />);

      await waitFor(() => {
        expect(screen.getByText('Sisyphus')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole('button', { name: '' }).filter(
        (btn) => btn.querySelector('svg.lucide-pencil'),
      );
      await userEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(
          screen.getByText('Edit Agent Model Assignment'),
        ).toBeInTheDocument();
      });

      const saveButton = screen.getByRole('button', { name: /Save Changes/i });
      await userEvent.click(saveButton);

      await waitFor(() => {
        expect(updateAgentRoutingConfig).toHaveBeenCalled();
      });
    });

    it('deve fechar dialog ao clicar em Cancel', async () => {
      vi.mocked(getAgentRoutingConfig).mockResolvedValueOnce(mockRoutingConfig);
      vi.mocked(getAllModels).mockResolvedValueOnce(mockModels);

      render(<AgentRoutingPage />);

      await waitFor(() => {
        expect(screen.getByText('Sisyphus')).toBeInTheDocument();
      });

      const editButtons = screen.getAllByRole('button', { name: '' }).filter(
        (btn) => btn.querySelector('svg.lucide-pencil'),
      );
      await userEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(
          screen.getByText('Edit Agent Model Assignment'),
        ).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await userEvent.click(cancelButton);

      await waitFor(() => {
        expect(
          screen.queryByText('Edit Agent Model Assignment'),
        ).not.toBeInTheDocument();
      });
    });

    it('deve mostrar "Edit Category Model Assignment" ao editar categoria', async () => {
      vi.mocked(getAgentRoutingConfig).mockResolvedValueOnce({});
      vi.mocked(getAllModels).mockResolvedValueOnce(mockModels);

      render(<AgentRoutingPage />);

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

      const categoryEditButtons = screen
        .getAllByRole('button', { name: '' })
        .filter((btn) => btn.querySelector('svg.lucide-pencil'));

      await userEvent.click(categoryEditButtons[11]);

      await waitFor(() => {
        expect(
          screen.getByText('Edit Category Model Assignment'),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Tabs', () => {
    it('deve renderizar ambas as tabs', async () => {
      vi.mocked(getAgentRoutingConfig).mockResolvedValueOnce({});
      vi.mocked(getAllModels).mockResolvedValueOnce(mockModels);

      render(<AgentRoutingPage />);

      await waitFor(() => {
        expect(screen.getByRole('tab', { name: 'Agents & Categories' })).toBeInTheDocument();
      });
      expect(screen.getByRole('tab', { name: 'Custom Aliases' })).toBeInTheDocument();
    });
  });
});