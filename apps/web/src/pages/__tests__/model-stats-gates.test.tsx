import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithQueryClient } from '../../__tests__/react-query-test-utils';
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
  createModel: false,
  updateModel: true,
  deleteModel: false,
  mergeModels: false,
  deleteModelLogs: false,
};

vi.mock('../../hooks/use-server-mode', () => ({
  useServerMode: () => ({
    mode: 'limited',
    capabilities: mockCapabilities,
    isLoading: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

vi.mock('../../lib/api-client', () => ({
  getModelStatistics: vi.fn().mockResolvedValue([
    {
      model: 'gpt-4',
      request_count: 100,
      total_spend: 50.0,
      total_tokens: 500000,
      prompt_tokens: 300000,
      completion_tokens: 200000,
      avg_tokens_per_request: 5000,
      avg_latency_ms: 1200,
      success_rate: 98.5,
      error_count: 2,
      avg_input_cost: 0.00003,
      avg_output_cost: 0.00006,
      p50_latency_ms: 800,
      p95_latency_ms: 3000,
      p99_latency_ms: 5000,
      first_seen: '2025-01-01T00:00:00Z',
      last_seen: '2025-01-30T00:00:00Z',
      unique_users: 10,
      unique_api_keys: 5,
    },
    {
      model: 'claude-3-opus',
      request_count: 50,
      total_spend: 30.0,
      total_tokens: 200000,
      prompt_tokens: 120000,
      completion_tokens: 80000,
      avg_tokens_per_request: 4000,
      avg_latency_ms: 1500,
      success_rate: 96.0,
      error_count: 2,
      avg_input_cost: 0.000015,
      avg_output_cost: 0.000075,
      p50_latency_ms: 1000,
      p95_latency_ms: 4000,
      p99_latency_ms: 7000,
      first_seen: '2025-01-05T00:00:00Z',
      last_seen: '2025-01-28T00:00:00Z',
      unique_users: 5,
      unique_api_keys: 3,
    },
  ]),
  deleteModelLogs: vi.fn().mockResolvedValue(undefined),
  mergeModels: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('sonner', async (importOriginal) => {
  const actual = await importOriginal<typeof import('sonner')>();
  return {
    ...actual,
    toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn() },
  };
});

import { ModelStatsPage } from '../model-stats';

describe('ModelStatsPage UI gates (limited mode)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should hide merge section when mergeModels=false', async () => {
    renderWithQueryClient(<ModelStatsPage />);

    await screen.findAllByText(/gpt-4|claude-3-opus/);

    const mergeButton = screen.queryByRole('button', {
      name: /^merge models$/i,
    });
    expect(mergeButton).toBeInTheDocument();
    expect(mergeButton).toBeDisabled();
  });

  it('should hide delete logs buttons when deleteModelLogs=false', async () => {
    renderWithQueryClient(<ModelStatsPage />);

    await screen.findAllByText(/gpt-4|claude-3-opus/);

    const disabledButtons = screen.queryAllByRole('button', { name: '—' });
    expect(disabledButtons.length).toBe(2);
    for (const btn of disabledButtons) {
      expect(btn).toBeDisabled();
    }
  });
});
