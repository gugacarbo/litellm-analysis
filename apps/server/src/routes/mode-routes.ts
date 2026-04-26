import type { AnalyticsDataSource } from '@lite-llm/analytics/types';
import type { Application } from 'express';

export function registerModeRoutes(
  app: Application,
  dataSource: AnalyticsDataSource,
) {
  app.get('/mode', (_req, res) => {
    const { capabilities } = dataSource;
    let mode: string;
    if (capabilities.errorLogs && capabilities.createModel) {
      mode = 'database';
    } else if (capabilities.errorLogs && !capabilities.createModel) {
      mode = 'limited';
    } else {
      mode = 'api-only';
    }
    res.json({
      mode,
      capabilities,
    });
  });
}
