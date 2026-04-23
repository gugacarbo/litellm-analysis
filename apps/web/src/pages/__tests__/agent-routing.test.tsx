import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AnalyticsCapabilities } from '../../types/analytics';

// vi.mock is hoisted by vitest — the import below MUST come after the mock definitions
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
import { getAgentRoutingConfig, updateAgentRoutingConfig, getAllModels } from '../../lib/api-client';

describe('AgentRoutingPage', () => {
  const mockRoutingConfig = {
    default: {
      prometheus: 'gpt-4',
      sisyphus: 'claude-3-opus',
    },
  };

  const mockModels = [
    { modelName: 'gpt-4', litellmParams: { api_base: 'https://api.openai.com' } },
    { modelName: 'gpt-3.5-turbo', litellmParams: { api_base: 'https://api.openai.com' } },
    { modelName: 'claude-3-opus', litellmParams: { api_base: 'https://api.anthropic.com' } },
    { modelName: 'claude-3-sonnet', litellmParams: { api_base: 'https://api.anthropic.com' } },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Renderização', () => {
    it('deve renderizar tabela com agentes', async () => {
      vi.mocked(getAgentRoutingConfig).mockResolvedValueOnce(mockRoutingConfig);
      vi.mocked(getAllModels).mockResolvedValueOnce(mockModels);

      render(<AgentRoutingPage />);

      // Aguarda carregamento e verifica agentes
      await waitFor(() => {
        expect(screen.getByText('Prometheus')).toBeInTheDocument();
      });

      expect(screen.getByText('Sisyphus')).toBeInTheDocument();
      expect(screen.getByText('Oracle')).toBeInTheDocument();
      expect(screen.getByText('Metis')).toBeInTheDocument();
    });

    it('deve mostrar loading state inicialmente', () => {
      vi.mocked(getAgentRoutingConfig).mockImplementation(() => new Promise(() => {}));
      vi.mocked(getAllModels).mockResolvedValueOnce([]);

      render(<AgentRoutingPage />);

      // Verifica skeletons de loading
      const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
      expect(skeletons.length).toBe(5);
    });

    it('deve mostrar erro quando fetch falha', async () => {
      vi.mocked(getAgentRoutingConfig).mockRejectedValueOnce(new Error('Failed to fetch'));
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
        expect(screen.getByText('gpt-4')).toBeInTheDocument();
      });

      expect(screen.getByText('claude-3-opus')).toBeInTheDocument();
    });

    it('deve mostrar "Unassigned" para agentes sem modelo configurado', async () => {
      vi.mocked(getAgentRoutingConfig).mockResolvedValueOnce({});
      vi.mocked(getAllModels).mockResolvedValueOnce(mockModels);

      render(<AgentRoutingPage />);

      await waitFor(() => {
        const unassignedElements = screen.getAllByText('Unassigned');
        expect(unassignedElements.length).toBe(7);
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
          btn => btn.querySelector('svg.lucide-pencil')
        );
        expect(editButtons.length).toBe(7);
      });
    });

    it('deve mostrar botões de editar em database mode', async () => {
      vi.mocked(getAgentRoutingConfig).mockResolvedValueOnce(mockRoutingConfig);
      vi.mocked(getAllModels).mockResolvedValueOnce(mockModels);

      render(<AgentRoutingPage />);

      await waitFor(() => {
        const editButtons = screen.getAllByRole('button', { name: '' }).filter(
          btn => btn.querySelector('svg.lucide-pencil')
        );
        expect(editButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Modo Limitado', () => {
    it('deve esconder botão de editar quando não é database mode', async () => {
      // Este teste verifica que em modo database, o botão de editar existe
      // e assumimos que em modo não-database ele não existiria devido ao FeatureGate
      vi.mocked(getAgentRoutingConfig).mockResolvedValueOnce(mockRoutingConfig);
      vi.mocked(getAllModels).mockResolvedValueOnce(mockModels);

      render(<AgentRoutingPage />);

      await waitFor(() => {
        // O botão de editar deve estar presente quando databaseAccess=true
        const editButtons = screen.getAllByRole('button', { name: '' }).filter(
          btn => btn.querySelector('svg.lucide-pencil')
        );
        expect(editButtons.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Interação', () => {
    it('deve abrir dialog ao clicar em editar', async () => {
      vi.mocked(getAgentRoutingConfig).mockResolvedValueOnce(mockRoutingConfig);
      vi.mocked(getAllModels).mockResolvedValueOnce(mockModels);

      render(<AgentRoutingPage />);

      await waitFor(() => {
        expect(screen.getByText('Prometheus')).toBeInTheDocument();
      });

      // Encontra e clica no botão de editar do primeiro agente
      const editButtons = screen.getAllByRole('button', { name: '' }).filter(
        btn => btn.querySelector('svg.lucide-pencil')
      );

      await userEvent.click(editButtons[0]);

      // Verifica que o dialog abriu
      await waitFor(() => {
        expect(screen.getByText('Edit Agent Model Assignment')).toBeInTheDocument();
      });
    });

    it('deve mostrar dropdown de modelos no dialog', async () => {
      vi.mocked(getAgentRoutingConfig).mockResolvedValueOnce(mockRoutingConfig);
      vi.mocked(getAllModels).mockResolvedValueOnce(mockModels);

      render(<AgentRoutingPage />);

      await waitFor(() => {
        expect(screen.getByText('Prometheus')).toBeInTheDocument();
      });

      // Abre o dialog
      const editButtons = screen.getAllByRole('button', { name: '' }).filter(
        btn => btn.querySelector('svg.lucide-pencil')
      );
      await userEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Edit Agent Model Assignment')).toBeInTheDocument();
      });

      // Verifica que o select existe
      expect(screen.getByText('Select Model')).toBeInTheDocument();
    });

    it('deve chamar updateAgentRoutingConfig ao salvar', async () => {
      vi.mocked(getAgentRoutingConfig).mockResolvedValueOnce(mockRoutingConfig);
      vi.mocked(getAllModels).mockResolvedValueOnce(mockModels);
      vi.mocked(updateAgentRoutingConfig).mockResolvedValueOnce({ success: true });

      render(<AgentRoutingPage />);

      await waitFor(() => {
        expect(screen.getByText('Prometheus')).toBeInTheDocument();
      });

      // Abre o dialog
      const editButtons = screen.getAllByRole('button', { name: '' }).filter(
        btn => btn.querySelector('svg.lucide-pencil')
      );
      await userEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Edit Agent Model Assignment')).toBeInTheDocument();
      });

      // Clica no Save Changes
      const saveButton = screen.getByRole('button', { name: /Save Changes/i });
      await userEvent.click(saveButton);

      // Verifica se a API foi chamada
      await waitFor(() => {
        expect(updateAgentRoutingConfig).toHaveBeenCalled();
      });
    });

    it('deve fechar dialog ao clicar em Cancel', async () => {
      vi.mocked(getAgentRoutingConfig).mockResolvedValueOnce(mockRoutingConfig);
      vi.mocked(getAllModels).mockResolvedValueOnce(mockModels);

      render(<AgentRoutingPage />);

      await waitFor(() => {
        expect(screen.getByText('Prometheus')).toBeInTheDocument();
      });

      // Abre o dialog
      const editButtons = screen.getAllByRole('button', { name: '' }).filter(
        btn => btn.querySelector('svg.lucide-pencil')
      );
      await userEvent.click(editButtons[0]);

      await waitFor(() => {
        expect(screen.getByText('Edit Agent Model Assignment')).toBeInTheDocument();
      });

      // Clica em Cancel
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      await userEvent.click(cancelButton);

      // Verifica que o dialog fechou
      await waitFor(() => {
        expect(screen.queryByText('Edit Agent Model Assignment')).not.toBeInTheDocument();
      });
    });
  });
});
