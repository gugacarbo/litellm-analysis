import { describe, expect, it } from 'vitest';
import { LIMITED_CAPABILITIES } from '../database';

const READ_CAPABILITIES = [
  'spendByModel',
  'spendByUser',
  'spendByKey',
  'spendLogs',
  'metricsSummary',
  'dailySpendTrend',
  'tokenDistribution',
  'performanceMetrics',
  'hourlyUsagePatterns',
  'apiKeyStats',
  'costEfficiency',
  'modelDistribution',
  'dailyTokenTrend',
  'modelStatistics',
  'models',
  'errorLogs',
  'detailedLatency',
  'logMerge',
  'filterOptions',
] as const;

describe('LIMITED_CAPABILITIES', () => {
  it('disables createModel', () => {
    expect(LIMITED_CAPABILITIES.createModel).toBe(false);
  });

  it('enables updateModel', () => {
    expect(LIMITED_CAPABILITIES.updateModel).toBe(true);
  });

  it('disables deleteModel', () => {
    expect(LIMITED_CAPABILITIES.deleteModel).toBe(false);
  });

  it('disables mergeModels', () => {
    expect(LIMITED_CAPABILITIES.mergeModels).toBe(false);
  });

  it('disables deleteModelLogs', () => {
    expect(LIMITED_CAPABILITIES.deleteModelLogs).toBe(false);
  });

  it.each(READ_CAPABILITIES)('enables read capability: %s', (cap) => {
    expect(LIMITED_CAPABILITIES[cap]).toBe(true);
  });
});
