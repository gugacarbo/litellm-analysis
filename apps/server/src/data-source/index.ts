import { ApiDataSource } from './api';
import { DatabaseDataSource, LIMITED_CAPABILITIES } from './database';
import type {
  AnalyticsDataSource,
  DataSourceConfig,
  DataSourceMode,
} from './types';

export function detectMode(): DataSourceMode {
  const accessMode = process.env.ACCESS_MODE;

  if (accessMode) {
    if (accessMode === 'full') return 'database';
    if (accessMode === 'api-only') return 'api-only';
    if (accessMode === 'limited') {
      if (process.env.DB_HOST) return 'database';
      console.warn(
        '[data-source] ACCESS_MODE=limited but DB_HOST is not set. Falling back to api-only mode.',
      );
      return 'api-only';
    }
  }

  const hasDbConfig = Boolean(process.env.DB_HOST);
  const hasApiConfig = Boolean(
    process.env.LITELLM_API_URL && process.env.LITELLM_API_KEY,
  );

  if (hasDbConfig) {
    return 'database';
  }
  if (hasApiConfig) {
    return 'api-only';
  }
  return 'database';
}

export function createDataSource(
  config?: DataSourceConfig,
): AnalyticsDataSource {
  const mode = config?.mode || detectMode();

  switch (mode) {
    case 'database':
      return new DatabaseDataSource();

    case 'limited':
      return new DatabaseDataSource(LIMITED_CAPABILITIES);

    case 'api-only': {
      const apiUrl = config?.api?.url || process.env.LITELLM_API_URL;
      const apiKey = config?.api?.api_key || process.env.LITELLM_API_KEY;

      if (!apiUrl || !apiKey) {
        throw new Error(
          `Missing API configuration for ${mode} mode. ` +
            'Provide LITELLM_API_URL and LITELLM_API_KEY environment variables or pass api config.',
        );
      }

      return new ApiDataSource(apiUrl, apiKey);
    }

    default:
      throw new Error(`Unknown data source mode: ${mode}`);
  }
}

export * from './interface';

export type {
  AnalyticsDataSource,
  DataSourceConfig,
  DataSourceMode,
} from './types';

export * from './types';
export { ApiDataSource, DatabaseDataSource, LIMITED_CAPABILITIES };
