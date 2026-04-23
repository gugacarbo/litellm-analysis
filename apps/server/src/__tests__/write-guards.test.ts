import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';
import {
  DATABASE_CAPABILITIES,
  LIMITED_CAPABILITIES,
} from '../data-source/database';
import type {
  AnalyticsCapabilities,
  AnalyticsDataSource,
} from '../data-source/types';

function createMockDataSource(
  capabilities: AnalyticsCapabilities,
): AnalyticsDataSource {
  return {
    capabilities,
    getMetricsSummary: vi.fn().mockResolvedValue({
      total_spend: 0,
      total_tokens: 0,
      active_models: 0,
      error_count: 0,
    }),
    getDailySpendTrend: vi.fn().mockResolvedValue([]),
    getSpendByModel: vi.fn().mockResolvedValue([]),
    getSpendByUser: vi.fn().mockResolvedValue([]),
    getSpendByKey: vi.fn().mockResolvedValue([]),
    getSpendLogsCount: vi.fn().mockResolvedValue(0),
    getSpendLogs: vi.fn().mockResolvedValue({
      logs: [],
      pagination: { total: 0, page: 1, page_size: 50, total_pages: 0 },
    }),
    getTokenDistribution: vi.fn().mockResolvedValue([]),
    getPerformanceMetrics: vi.fn().mockResolvedValue({
      total_requests: 0,
      avg_duration_ms: 0,
      success_rate: 0,
    }),
    getHourlyUsagePatterns: vi.fn().mockResolvedValue([]),
    getApiKeyStats: vi.fn().mockResolvedValue([]),
    getCostEfficiency: vi.fn().mockResolvedValue([]),
    getModelDistribution: vi.fn().mockResolvedValue([]),
    getDailyTokenTrend: vi.fn().mockResolvedValue([]),
    getModelStatistics: vi.fn().mockResolvedValue([]),
    getModels: vi.fn().mockResolvedValue([]),
    getModelDetails: vi.fn().mockResolvedValue([]),
    getErrorLogs: vi.fn().mockResolvedValue([]),
    createModel: vi.fn().mockResolvedValue(undefined),
    updateModel: vi.fn().mockResolvedValue(undefined),
    deleteModel: vi.fn().mockResolvedValue(undefined),
    mergeModels: vi.fn().mockResolvedValue(undefined),
    deleteModelLogs: vi.fn().mockResolvedValue(undefined),
    getAgentRoutingConfig: vi.fn().mockResolvedValue({}),
    updateAgentRoutingConfig: vi.fn().mockResolvedValue(undefined),
    getAgentConfigs: vi.fn().mockResolvedValue({}),
    getCategoryConfigs: vi.fn().mockResolvedValue({}),
    updateAgentConfig: vi.fn().mockResolvedValue(undefined),
    updateCategoryConfig: vi.fn().mockResolvedValue(undefined),
    deleteAgentConfig: vi.fn().mockResolvedValue(undefined),
    deleteCategoryConfig: vi.fn().mockResolvedValue(undefined),
  };
}

async function getServer(capabilities: AnalyticsCapabilities) {
  const { createApiServer } = await import('../api-server');
  const mockDs = createMockDataSource(capabilities);
  return createApiServer(mockDs);
}

describe('Write endpoint guards', () => {
  it('POST /models returns 403 in limited mode', async () => {
    const app = await getServer(LIMITED_CAPABILITIES);
    const res = await request(app).post('/models').send({ modelName: 'test' });
    expect(res.status).toBe(403);
  });

  it('DELETE /models/:name returns 403 in limited mode', async () => {
    const app = await getServer(LIMITED_CAPABILITIES);
    const res = await request(app).delete('/models/test-model');
    expect(res.status).toBe(403);
  });

  it('POST /models/merge returns 403 in limited mode', async () => {
    const app = await getServer(LIMITED_CAPABILITIES);
    const res = await request(app)
      .post('/models/merge')
      .send({ sourceModel: 'a', targetModel: 'b' });
    expect(res.status).toBe(403);
  });

  it('DELETE /models/logs/:model returns 403 in limited mode', async () => {
    const app = await getServer(LIMITED_CAPABILITIES);
    const res = await request(app).delete('/models/logs/test-model');
    expect(res.status).toBe(403);
  });

  it('DELETE /models/logs?model= returns 403 in limited mode', async () => {
    const app = await getServer(LIMITED_CAPABILITIES);
    const res = await request(app).delete('/models/logs?model=');
    expect(res.status).toBe(403);
  });

  it('PUT /models/:name returns 200 in limited mode (update allowed)', async () => {
    const app = await getServer(LIMITED_CAPABILITIES);
    const res = await request(app)
      .put('/models/test-model')
      .send({ litellmParams: {} });
    expect(res.status).toBe(200);
  });

  it('POST /models returns 201 in full mode', async () => {
    const app = await getServer(DATABASE_CAPABILITIES);
    const res = await request(app).post('/models').send({ modelName: 'test' });
    expect(res.status).toBe(201);
  });

  it('DELETE /models/logs?model= forwards empty model in full mode', async () => {
    const { createApiServer } = await import('../api-server');
    const mockDs = createMockDataSource(DATABASE_CAPABILITIES);
    const app = createApiServer(mockDs);

    const res = await request(app).delete('/models/logs?model=');

    expect(res.status).toBe(200);
    expect(mockDs.deleteModelLogs).toHaveBeenCalledWith('');
  });

  it('DELETE /models/logs without query model returns 400 in full mode', async () => {
    const app = await getServer(DATABASE_CAPABILITIES);
    const res = await request(app).delete('/models/logs');
    expect(res.status).toBe(400);
  });
});
